// dsh-rules materialization engine (M1, REQUIREMENTS v1.0 — project-only initializer).
// Responsibilities: turn a versioned rule pack into concrete files per project —
//  • fresh .agents/notes skeleton (whole-subtree mirror, never clobbering existing notes);
//  • marker-managed segments appended to the root AGENTS.md (note-discipline block +
//    feature sections per manifest.features defaults);
//  • user-selected optional skill copies under .agents/skills/<name> (dependency-managed
//    per project; conflict reported, never overwritten without --force);
//  • the docGates toolchain under <project>/.dsh-rules/toolchain (umbrella feature +
//    per-group gating; composed package.json; disabled groups remove managed copies).
// The global plane (~/.dsh/AGENTS.md, user skill roots) is intentionally out of scope:
// no command writes there (REQUIREMENTS v1.0 D1/D2). Every operation is idempotent:
import { readFile, writeFile, mkdir, readdir, rmdir, stat, unlink } from 'node:fs/promises'
import { join, dirname, normalize, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanSource, listFiles } from './pack.mjs'
import { preview } from './diff.mjs'

const THIS_LIB = dirname(fileURLToPath(import.meta.url))
/** Pack location convention: <repo-root>/rules-pack next to the plugin source. */
export function defaultPackDir() {
  const env = process.env.DSH_RULES_PACK
  if (env) return resolve(env)
  return normalize(join(THIS_LIB, '..', 'rules-pack'))
}
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

/**
 * Wrap cleaned content in the id-based marker segment (deterministic formatting).
 * The block ends WITHOUT a trailing newline: upsertSegmentText owns all inter-block blank
 * lines ('\n\n' separators). This keeps multi-segment files byte-stable across repeated
 * runs (idempotent) — no double newlines between a block's own ending and the separator.
 */
export function makeSegment(id, body) {
  const inner = (body ?? '').replace(/\s+$/, '') + '\n'
  return startMarker(id) + '\n' + inner + endMarker(id)
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

/** Feature gate: run-level override (opts.features) wins per key; absent keys fall back to pack defaults. */
function featureEnabled(pack, opts, key) {
  if (!key) return true
  if (opts.features && key in opts.features) return !!opts.features[key]
  return !!pack.features[key]
}

/** Deterministically compose the toolchain package.json for a set of enabled group ids. */
export function composeToolchainPackageJson(tc, enabledGroupIds) {
  const pg = tc.packageJson || {}
  const scripts = Object.assign({}, pg.baseScripts || {})
  const deps = Object.assign({}, pg.baseDeps || {})
  const verifyNames = []
  for (const g of tc.groups) {
    if (!enabledGroupIds.has(g.id)) continue
    Object.assign(scripts, g.scripts)
    Object.assign(deps, g.deps)
    for (const v of g.verify) {
      scripts[v] = 'tsx scripts/' + v + '.ts'
      verifyNames.push(v)
    }
  }
  scripts['doc-sync'] = verifyNames.length
    ? verifyNames.map((v) => 'pnpm run ' + v).join(' && ')
    : 'echo "no doc gates enabled (dsh-rules: enable a gate group)"'
  const body = {
    name: pg.name || 'dsh-rules-toolchain',
    version: pg.version || '0.0.0',
    private: pg.private !== undefined ? pg.private : true,
    type: pg.type || 'module',
    engines: pg.engines || { node: '>=20' },
    scripts,
    devDependencies: deps
  }
  return JSON.stringify(body, null, 2) + '\n'
}

async function readText(abs) {
  try { return await readFile(abs, 'utf8') } catch { return null }
}

/** Remove an empty file's parent dirs up to (and including) the managed home. */
async function pruneEmptyDirs(filePath, homeAbs) {
  let dir = dirname(filePath)
  while (homeAbs && (dir === homeAbs || dir.startsWith(homeAbs + sep))) {
    let names = []
    try { names = await readdir(dir) } catch { return }
    if (names.length > 0) return
    try { await rmdir(dir) } catch { return }
    if (dir === homeAbs) return
    dir = dirname(dir)
  }
}

// ---------------------------------------------------------------------------
// Plan construction
// ---------------------------------------------------------------------------

/**
 * Build the project-scope plan for init/upgrade/status.
 * Returns { scope, projectRoot, entries } where each entry is one of
 *   { kind:'dir', targetAbs, label }
 *   { kind:'file', id, targetAbs, content, label }                 (exact copy / composed)
 *   { kind:'file-remove', id, targetAbs, home, expect, label }     (managed-copy removal)
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
    // feature gate: run-level override (opts.features) wins per key; absent keys fall back to pack defaults
    const enabled = !row.feature || (opts.features && row.feature in opts.features ? !!opts.features[row.feature] : !!pack.features[row.feature])
    const raw = enabled ? cleanSource(await readFile(row.sourceAbs, 'utf8')) : null
    entries.push({
      kind: 'segment', id: row.id, targetAbs: join(projectRoot, 'AGENTS.md'),
      body: raw, label: 'AGENTS.md (segment ' + row.id + ')', feature: row.feature, enabled
    })
  }

  // (b2) whole-file manifest entries (for example docs/AGENTS.md) are copied to their
  // project-relative targets. Feature-gated files use the same conflict-safe removal
  // semantics as toolchain files when the feature is disabled.
  for (const row of pack.rows) {
    if (row.target === 'AGENTS.md') continue
    const enabled = !row.feature || (opts.features && row.feature in opts.features ? !!opts.features[row.feature] : !!pack.features[row.feature])
    const targetAbs = join(projectRoot, row.target)
    if (enabled) {
      const content = cleanSource(await readFile(row.sourceAbs, 'utf8'))
      entries.push({ kind: 'file', id: 'pack:' + row.id, targetAbs, content, label: row.target, feature: row.feature })
    } else {
      let present = false
      try { present = (await stat(targetAbs)).isFile() } catch { /* absent */ }
      if (present) {
        const expect = await readFile(row.sourceAbs, 'utf8')
        entries.push({ kind: 'file-remove', id: 'pack-remove:' + row.id, targetAbs, label: row.target, home: projectRoot, expect, note: 'feature ' + row.feature + ' disabled' })
      }
    }
  }

  // (c) selected optional skills → <project>/.agents/skills/<name>/ (dependency-managed copies).
  // Manifest features.optionalSkills is the always-selected baseline; opts.skills adds more.
  // Copy semantics reuse 'file' evaluation: equal→skip, edited/foreign→conflict (never
  // overwritten without --force), so user self-installed skills are never clobbered.
  // Removal of a no-longer-selected skill and managed/user bookkeeping are deferred
  // (REQUIREMENTS v1.0 §7 DP-F / DP-G).
  const wanted = new Set([...(pack.features.optionalSkills || []), ...(opts.skills || [])])
  const skillsDir = join(pack.dir, 'skills-optional')
  for (const name of wanted) {
    const src = join(skillsDir, name)
    try {
      const files = await listFiles(src)
      for (const f of files) {
        const content = cleanSource(await readFile(f.abs, 'utf8'))
        const targetAbs = join(projectRoot, '.agents', 'skills', name, f.rel)
        entries.push({ kind: 'file', id: 'skill:' + name + ':' + f.rel, targetAbs, content, label: relative(projectRoot, targetAbs) })
      }
    } catch {
      entries.push({ kind: 'missing-skill', name, label: 'skill ' + name })
    }
  }
  // (d) docGates toolchain → <project>/<toolchain.target>/ — umbrella feature + per-group gating.
  // Enabled groups materialize their files plus the composed package.json; disabled groups
  // schedule removal of managed copies (byte-equal ⇒ remove; edited/drifted ⇒ conflict).
  const tc = pack.toolchain
  if (tc) {
    const home = join(projectRoot, tc.target)
    const umbrella = featureEnabled(pack, opts, tc.feature)
    const enabledGroups = new Set()
    const defaultGroups = new Set()
    if (umbrella) entries.push({ kind: 'dir', targetAbs: home, label: tc.target })
    for (const g of tc.groups) {
      const on = umbrella && featureEnabled(pack, opts, g.feature)
      const onByDefault = !g.feature || !!pack.features[g.feature]
      if (on) enabledGroups.add(g.id)
      if (onByDefault) defaultGroups.add(g.id)
      for (const f of g.files) {
        const targetAbs = join(home, f.rel)
        const label = join(tc.target, f.rel)
        if (on) {
          const content = await readText(f.abs)
          if (content !== null) {
            entries.push({ kind: 'file', id: 'toolchain:' + g.id + ':' + f.rel, targetAbs, content, label, feature: g.feature, group: g.id })
          }
        } else {
          // schedule removal only when the managed copy actually exists (keeps status quiet)
          let present = false
          try { present = (await stat(targetAbs)).isFile() } catch { /* absent */ }
          if (present) {
            const expect = await readText(f.abs)
            entries.push({ kind: 'file-remove', id: 'toolchain-remove:' + g.id + ':' + f.rel, targetAbs, label, home, expect, note: 'group ' + g.id + ' disabled' })
          }
        }
      }
    }
    const pkgPath = join(home, 'package.json')
    if (umbrella) {
      const pkg = composeToolchainPackageJson(tc, enabledGroups)
      // The composed package.json is fully managed (derived from enabled groups): feature
      // toggles/upgrades update it like a segment, not a user-owned copy.
      entries.push({ kind: 'file', id: 'toolchain:package.json', targetAbs: pkgPath, content: pkg, label: join(tc.target, 'package.json'), group: 'package.json', managedUpdate: true })
    } else {
      // docGates off ⇒ remove the whole managed toolchain; package.json is removable when it
      // still matches the pack-default composition (customized ⇒ conflict, manual cleanup).
      const pkgRef = composeToolchainPackageJson(tc, defaultGroups)
      let pkgPresent = false
      try { pkgPresent = (await stat(pkgPath)).isFile() } catch { /* absent */ }
      if (pkgPresent) {
        entries.push({ kind: 'file-remove', id: 'toolchain-remove:package.json', targetAbs: pkgPath, label: join(tc.target, 'package.json'), home, expect: pkgRef, note: 'docGates disabled' })
      }
    }
  }
  return { scope: 'project', projectRoot, entries }
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
      else if (opts.force || e.managedUpdate) out.push(Object.assign({}, e, { action: 'update', preview: preview(e.label, existing, e.content) }))
      else out.push(Object.assign({}, e, { action: 'conflict', preview: preview(e.label, existing, e.content) }))
      continue
    }
    if (e.kind === 'file-remove') {
      if (existing === null) out.push(Object.assign({}, e, { action: 'skip', note: 'not present' }))
      else if (opts.force || (e.expect !== null && existing === e.expect)) out.push(Object.assign({}, e, { action: 'remove' }))
      else out.push(Object.assign({}, e, { action: 'conflict', note: 'modified or version-drifted — kept; remove with --force or manually' }))
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

/**
 * Apply evaluated results (call after review).
 * copy-file ('file') rows write their own content. Segment rows targeting the same file are
 * grouped per target and applied cumulatively in plan order (each upsert/remove computed against
 * the evolving text), then written once — a fresh init with several enabled AGENTS.md segments
 * (note block + feature sections) must not let one segment clobber another.
 */
export async function applyResults(results) {
  const applied = []
  const segmentGroups = new Map() // targetAbs -> ordered segment results to write
  for (const r of results) {
    if (r.kind === 'dir') {
      await mkdir(r.targetAbs, { recursive: true })
      applied.push(Object.assign({}, r, { applied: true }))
      continue
    }
    if (r.action === 'skip' || r.action === 'conflict' || r.action === 'missing') continue
    if (r.action === 'remove' && r.kind === 'file-remove') {
      try { await unlink(r.targetAbs) } catch { /* already gone */ }
      await pruneEmptyDirs(r.targetAbs, r.home)
      applied.push(Object.assign({}, r, { applied: true }))
      continue
    }
    if (r.kind === 'file') {
      await mkdir(dirname(r.targetAbs), { recursive: true })
      await writeFile(r.targetAbs, r.content, 'utf8')
      applied.push(Object.assign({}, r, { applied: true }))
      continue
    }
    const list = segmentGroups.get(r.targetAbs) || []
    list.push(r)
    segmentGroups.set(r.targetAbs, list)
  }
  for (const [targetAbs, segs] of segmentGroups) {
    let text = await readTarget(targetAbs)
    if (text == null) text = ''
    const changed = []
    for (const s of segs) {
      const desired = s.body === null ? removeSegmentText(text, s.id) : upsertSegmentText(text, s.id, s.body)
      if (desired !== text) { text = desired; changed.push(s) }
    }
    await mkdir(dirname(targetAbs), { recursive: true })
    if (changed.length) await writeFile(targetAbs, text, 'utf8')
    for (const s of changed) applied.push(Object.assign({}, s, { applied: true }))
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
    // managed docGates toolchain: files inside the managed home that the pack does not own
    // (node_modules, lockfiles, the composed package.json) are expected; anything else is reported.
    if (pack.toolchain) {
      const home = join(projectRoot, pack.toolchain.target)
      const managed = new Set()
      for (const g of pack.toolchain.groups) for (const f of g.files) managed.add(f.rel)
      const expected = (rel) => rel === 'package.json' || rel.split('/').includes('node_modules') || /\.(lock|log)$/.test(rel)
      const walk = async (dirAbs, prefix) => {
        let names = []
        try { names = await readdir(dirAbs) } catch { return }
        for (const name of names) {
          if (name === 'node_modules') continue
          const abs = join(dirAbs, name)
          const rel = prefix ? prefix + '/' + name : name
          let isDir = false
          try { isDir = (await stat(abs)).isDirectory() } catch { continue }
          if (isDir) { await walk(abs, rel); continue }
          if (!managed.has(rel) && !expected(rel)) {
            notes.push({ level: 'info', what: 'toolchain-extra', detail: rel + ' inside the managed ' + pack.toolchain.target + '/' })
          }
        }
      }
      await walk(home, '')
    }
  }
  return notes
}
