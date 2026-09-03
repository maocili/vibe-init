// dsh-rules materialization engine (M1).
// Responsibilities (DESIGN §4/§5): turn a versioned rule pack into concrete files —
//  • project scope: fresh .agents/notes skeleton (whole-subtree mirror, never clobbering
//    existing notes) + marker-managed segments appended to the root AGENTS.md;
//  • global scope: ~/.dsh/AGENTS.md segment managed by marker (user edits outside the
//    segment are preserved) + selected optional skills copied to the user skill root.
// Every operation is idempotent: content-equality short-circuits, marker segments are
// located by id, and foreign/edited files are reported (conflict), never overwritten
// unless --force.
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import { join, dirname, normalize, resolve, relative, sep } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { cleanSource, listFiles } from './pack.mjs'
import { preview } from './diff.mjs'

const THIS_LIB = dirname(fileURLToPath(import.meta.url))
/** Pack location convention: <repo-root>/rules-pack next to the plugin/ directory. */
export function defaultPackDir() {
  const env = process.env.DSH_RULES_PACK
  if (env) return resolve(env)
  return normalize(join(THIS_LIB, '..', '..', 'rules-pack'))
}
export function defaultDshHome() { return process.env.DSH_HOME || join(homedir(), '.dsh') }
export function defaultSkillRoot() { return process.env.DSH_RULES_SKILL_ROOT || join(homedir(), '.agents', 'skills') }

/** Locate the project root: walk upward from start until a .git is found; fallback: start. */
export async function resolveProjectRoot(start) {
  let dir = resolve(start)
  for (;;) {
    try {
      const st = await stat(join(dir, '.git'))
      if (st.isDirectory() || st.isFile()) return dir
    } catch { /* keep walking */ }
    const parent = dirname(dir)
    if (parent === dir) return resolve(start)
    dir = parent
  }
}

function startMarker(id) { return '<!-- dsh-rules:' + id + ':start -->' }
function endMarker(id) { return '<!-- dsh-rules:' + id + ':end -->' }

/** Wrap cleaned content in the id-based marker segment (deterministic formatting). */
export function makeSegment(id, body) {
  const inner = (body ?? '').replace(/\s+$/, '') + '\n'
  return startMarker(id) + '\n' + inner + endMarker(id) + '\n'
}

/** Build full-file text with the segment for id upserted. Never touches text outside the segment. */
export function upsertSegmentText(existing, id, body) {
  const block = makeSegment(id, body)
  const existingText = existing == null ? '' : String(existing)
  const s = existingText.indexOf(startMarker(id))
  if (s >= 0) {
    const e = existingText.indexOf(endMarker(id), s)
    if (e >= 0) {
      const before = existingText.slice(0, s)
      const after = existingText.slice(e + endMarker(id).length)
      const head = before.replace(/\n+$/, '')
      const tail = after.replace(/^\n+/, '')
      let res
      if (head === '' && tail === '') res = block
      else if (head === '') res = block + (tail === '' ? '' : '\n\n' + tail)
      else if (tail === '') res = head + '\n\n' + block
      else res = head + '\n\n' + block + '\n\n' + tail
      const out = res.trimEnd()
      return out === '' ? '' : out + '\n'
    }
  }
  const tail2 = existingText.trimEnd()
  const prefix = tail2 === '' ? '' : tail2 + '\n\n'
  const suffix = tail2 === '' ? '' : '\n'
  return prefix + block + suffix
}

/** Remove the segment for id from the file text; returns unchanged text when absent. */
export function removeSegmentText(existing, id) {
  const existingText = existing == null ? '' : String(existing)
  const s = existingText.indexOf(startMarker(id))
  if (s < 0) return existingText
  const e = existingText.indexOf(endMarker(id), s)
  const end = e >= 0 ? e + endMarker(id).length : s + startMarker(id).length
  const before = existingText.slice(0, s)
  const after = existingText.slice(end)
  const base = before.replace(/\n+$/, '')
  let out
  if (after.trim() === '') out = base.trimEnd()
  else out = (base ? base + '\n\n' : '') + after.replace(/^\n+/, '')
  out = out.trimEnd()
  return out === '' ? '' : out + '\n'
}



// ---------------------------------------------------------------------------
// Plan construction
// ---------------------------------------------------------------------------

/**
 * Build the project-scope plan for init/upgrade/status.
 * Returns { scope, projectRoot, entries } where each entry is one of
 *   { kind:'dir', targetAbs, label }
 *   { kind:'file', id, targetAbs, content, label }                 (skeleton mirror; exact copy)
 *   { kind:'segment', id, targetAbs, body, label, feature, enabled }  (AGENTS.md marker blocks)
 */
export async function planProject(pack, projectRoot, opts = {}) {
  const entries = []
  const skeletonDir = join(pack.dir, 'notes-skeleton')
  let skeletonFiles = []
  try {
    skeletonFiles = await listFiles(skeletonDir)
  } catch { /* notes-skeleton absent → nothing to mirror */ }

  // (a) whole-subtree skeleton mirror: dirs first, then non-empty cleaned files; .gitkeep never copied.
  for (const f of skeletonFiles) {
    const relDirs = f.rel.split(sep).slice(0, -1)
    let acc = join(projectRoot, '.agents', 'notes')
    for (const d of relDirs) {
      acc = join(acc, d)
      entries.push({ kind: 'dir', targetAbs: acc, label: relative(projectRoot, acc) })
    }
    if (f.rel.split(sep).pop() === '.gitkeep') continue // guard file: keep dir, never copy the file
    const content = cleanSource(await readFile(f.abs, 'utf8'))
    if (content.trim() === '') continue
    const targetAbs = join(projectRoot, '.agents', 'notes', f.rel)
    entries.push({ kind: 'file', id: 'notes-skeleton:' + f.rel, targetAbs, content, label: relative(projectRoot, targetAbs) })
  }
  // ensure the notes root dir itself
  entries.unshift({ kind: 'dir', targetAbs: join(projectRoot, '.agents', 'notes'), label: '.agents/notes' })

  // (b) marker-managed segments onto the project root AGENTS.md
  for (const row of pack.rows) {
    if (row.target !== 'AGENTS.md') continue
    const enabled = !row.feature || (opts.features ? !!opts.features[row.feature] : !!pack.features[row.feature])
    const raw = enabled ? cleanSource(await readFile(row.sourceAbs, 'utf8')) : null
    entries.push({
      kind: 'segment', id: row.id, targetAbs: join(projectRoot, 'AGENTS.md'),
      body: raw, label: 'AGENTS.md (segment ' + row.id + ')', feature: row.feature, enabled
    })
  }
  return { scope: 'project', projectRoot, entries }
}

/**
 * Build the global-scope plan: the ~/.dsh/AGENTS.md segment row + optional skill copies.
 * opts.skills: extra skill names to install (beyond manifest features.optionalSkills).
 */
export async function planGlobal(pack, dshHome, opts = {}) {
  const entries = []
  for (const row of pack.rows) {
    if (!row.target.startsWith('~/')) continue
    const relTarget = row.target.slice(2) // '.dsh/AGENTS.md'
    const targetAbs = relTarget.startsWith('.dsh/')
      ? join(dshHome, relTarget.slice('.dsh/'.length))
      : join(homedir(), relTarget)
    const body = cleanSource(await readFile(row.sourceAbs, 'utf8'))
    entries.push({ kind: 'segment', id: row.id, targetAbs, body, label: 'global ' + row.target })
  }
  // optional skills
  const wanted = new Set([...(pack.features.optionalSkills || []), ...(opts.skills || [])])
  const skillRoot = opts.skillRoot || defaultSkillRoot()
  const skillsDir = join(pack.dir, 'skills-optional')
  for (const name of wanted) {
    const src = join(skillsDir, name)
    try {
      const files = await listFiles(src)
      for (const f of files) {
        const content = cleanSource(await readFile(f.abs, 'utf8'))
        entries.push({
          kind: 'file', id: 'skill:' + name + ':' + f.rel, targetAbs: join(skillRoot, name, f.rel),
          content, label: 'skill ' + name + '/' + f.rel
        })
      }
    } catch {
      entries.push({ kind: 'missing-skill', name, label: 'skill ' + name })
    }
  }
  return { scope: 'global', dshHome, skillRoot, entries }
}


// ---------------------------------------------------------------------------
// Evaluate & apply
// ---------------------------------------------------------------------------

async function readTarget(p) {
  try { return await readFile(p, 'utf8') } catch { return null }
}

/**
 * Resolve each entry into an actionable result without writing.
 * result: { kind, action: 'dir'|'skip'|'update'|'create'|'conflict'|'missing',
 *           label, targetAbs, content|desired?, preview? }
 */
export async function evaluatePlan(plan, opts = {}) {
  const out = []
  const seen = new Set()
  for (const e of plan.entries) {
    if (e.kind === 'dir') { out.push(Object.assign({}, e, { action: 'dir' })); continue }
    if (e.kind === 'missing-skill') { out.push(Object.assign({}, e, { action: 'missing' })); continue }
    const key = e.targetAbs + '|' + e.id
    if (seen.has(key)) { out.push(Object.assign({}, e, { action: 'skip', note: 'duplicate target' })); continue }
    seen.add(key)
    const existing = await readTarget(e.targetAbs)
    if (e.kind === 'file') {
      if (existing === null) out.push(Object.assign({}, e, { action: 'create' }))
      else if (existing === e.content) out.push(Object.assign({}, e, { action: 'skip' }))
      else if (opts.force) out.push(Object.assign({}, e, { action: 'update', preview: preview(e.label, existing, e.content) }))
      else out.push(Object.assign({}, e, { action: 'conflict', preview: preview(e.label, existing, e.content) }))
      continue
    }
    // segment
    const desired = e.body === null ? removeSegmentText(existing, e.id) : upsertSegmentText(existing, e.id, e.body)
    if (desired === (existing || '')) out.push(Object.assign({}, e, { action: 'skip' }))
    else if (e.body === null) out.push(Object.assign({}, e, { action: 'update', desired, preview: preview(e.label, existing, desired), note: 'segment removed (feature disabled)' }))
    else if (existing === null || existing.trim() === '') out.push(Object.assign({}, e, { action: 'create', desired }))
    else out.push(Object.assign({}, e, { action: 'update', desired, preview: preview(e.label, existing, desired) }))
  }
  return out
}

/** Apply evaluated results (call after review; segment results already carry desired content). */
export async function applyResults(results) {
  const applied = []
  for (const r of results) {
    if (r.kind === 'dir') {
      await mkdir(r.targetAbs, { recursive: true })
      applied.push(Object.assign({}, r, { applied: true }))
      continue
    }
    if (r.action === 'skip' || r.action === 'conflict' || r.action === 'missing') continue
    await mkdir(dirname(r.targetAbs), { recursive: true })
    const content = r.kind === 'file' ? r.content : r.desired
    if (content !== undefined) await writeFile(r.targetAbs, content, 'utf8')
    applied.push(Object.assign({}, r, { applied: true }))
  }
  return applied
}

// ---------------------------------------------------------------------------
// Summaries & audit extras
// ---------------------------------------------------------------------------

export function summarize(results) {
  const by = {}
  for (const r of results) by[r.action] = (by[r.action] || 0) + 1
  return by
}

/** audit extras: pack integrity + residue heuristics for the project scope. */
export async function auditExtras(pack, projectRoot) {
  const notes = []
  for (const row of pack.rows) {
    if (row.declaredSha256 && row.declaredSha256 !== row.actualSha256) {
      notes.push({ level: 'warn', what: 'pack-drift', detail: row.id + ': manifest sha256 stale (re-run "dsh-rules hash")' })
    }
  }
  if (projectRoot) {
    // old consumption-model residue: a copied .template/ at the project root
    try {
      if ((await stat(join(projectRoot, '.template'))).isDirectory()) {
        notes.push({ level: 'flag', what: 'residue-template', detail: '.template/ present — old copy-the-container residue; quarantine or delete if not intended (DESIGN §7.2)' })
      }
    } catch { }
    // duplicated container skills
    try {
      for (const name of await readdir(join(projectRoot, '.agents', 'skills'))) {
        if (name.startsWith('dsh-')) notes.push({ level: 'flag', what: 'residue-skill', detail: '.agents/skills/' + name + ' duplicates built-in dsh-* skill' })
      }
    } catch { }
    // unexpected top-level entries in a fresh notes tree
    const known = ['README.md', 'README.zh.md', 'README.i18n.yaml', 'AGENTS.md', 'manifest.json', 'proposed', 'rejected', 'implemented', 'archived']
    try {
      for (const name of await readdir(join(projectRoot, '.agents', 'notes'))) {
        if (!known.includes(name)) notes.push({ level: 'info', what: 'unknown-top-level', detail: '.agents/notes/' + name })
      }
    } catch { }
  }
  return notes
}
