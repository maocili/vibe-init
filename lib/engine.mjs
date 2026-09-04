// dsh-rules materialization engine (M1, REQUIREMENTS v1.0 — project-only initializer).
// Responsibilities: turn a versioned rule pack into concrete files per project —
//  • fresh .agents/notes skeleton (whole-subtree mirror, never clobbering existing notes);
//  • marker-managed segments appended to the root AGENTS.md (note-discipline block +
//    feature sections per manifest.features defaults);
//  • default project skill copies under .agents/skills/<name> (dependency-managed per project;
//    init is conflict-safe, upgrade refreshes declared files and keeps user additions);
//  • the docGates toolchain under <project>/.dsh-rules/toolchain (umbrella feature +
//    per-group gating; composed package.json; disabled groups remove managed copies).
// The global plane (~/.dsh/AGENTS.md, user skill roots) is intentionally out of scope:
// no command writes there (REQUIREMENTS v1.0 D1/D2). Every operation is idempotent:
import { readFile, writeFile, mkdir, readdir, rmdir, stat, unlink } from 'node:fs/promises'
import { join, dirname, normalize, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanSource, listFiles } from './pack.mjs'
import { preview } from './diff.mjs'
import { contentSha256, readProjectState } from './state.mjs'

const THIS_LIB = dirname(fileURLToPath(import.meta.url))
/** Pack location convention: <repo-root>/packages next to the plugin source. */
export function defaultPackDir() {
  const env = process.env.DSH_RULES_PACK
  if (env) return resolve(env)
  return normalize(join(THIS_LIB, '..', 'packages'))
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
      // The marker body is the managed region. Preserve every byte before the start marker
      // and after the end marker so user-authored sections (including their whitespace) are
      // never rewritten during an upgrade.
      return existingText.slice(0, s) + block + existingText.slice(e + endMarker(id).length)
    }
  }
  if (existingText === '') return block
  const separator = existingText.endsWith('\n') ? '\n' : '\n\n'
  return existingText + separator + block + '\n'
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

/** Leave readable text behind when an optional note-pair target is not materialized. */
function removeDisabledNotePairLinks(text) {
  return text.replace(/\[([^\]]+)\]\(README\.(?:zh\.md|i18n\.yaml)\)/g, '$1')
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
async function planInitProject(pack, projectRoot, opts = {}) {
  const entries = []
  const skeletonDir = join(pack.dir, 'notes-skeleton')
  let skeletonFiles = []
  try {
    skeletonFiles = await listFiles(skeletonDir)
  } catch { /* notes-skeleton absent → nothing to mirror */ }

  // (a) whole-subtree skeleton mirror: dirs first, then non-empty cleaned files; .gitkeep never copied.
  // The notes README pair is a real feature: disable it without deleting a user-edited
  // translation or sidecar. Other note files remain English-only skeleton content.
  for (const f of skeletonFiles) {
    const relDirs = f.rel.split(sep).slice(0, -1)
    let acc = join(projectRoot, '.agents', 'notes')
    for (const d of relDirs) {
      acc = join(acc, d)
      entries.push({ kind: 'dir', targetAbs: acc, label: relative(projectRoot, acc) })
    }
    if (f.rel.split(sep).pop() === '.gitkeep') continue // guard file: keep dir, never copy the file
    let content = cleanSource(await readFile(f.abs, 'utf8'))
    if (content.trim() === '') continue
    const alternateManagedContents = f.rel === 'README.md'
      ? [content, removeDisabledNotePairLinks(content)]
      : null
    const targetAbs = join(projectRoot, '.agents', 'notes', f.rel)
    const isBilingualArtifact = f.rel.endsWith('.zh.md') || f.rel.endsWith('.i18n.yaml')
    if (isBilingualArtifact && !featureEnabled(pack, opts, 'bilingualPairing')) {
      let present = false
      try { present = (await stat(targetAbs)).isFile() } catch { /* absent */ }
      if (present) {
        entries.push({
          kind: 'file-remove', id: 'notes-skeleton-remove:' + f.rel, targetAbs,
          label: relative(projectRoot, targetAbs), home: join(projectRoot, '.agents', 'notes'),
          expect: content, note: 'feature bilingualPairing disabled'
        })
      }
      continue
    }
    if (f.rel === 'README.md' && !featureEnabled(pack, opts, 'bilingualPairing')) content = alternateManagedContents[1]
    entries.push({
      kind: 'file', id: 'notes-skeleton:' + f.rel, targetAbs, content,
      managedContents: alternateManagedContents, label: relative(projectRoot, targetAbs)
    })
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

  // (c) default skills → <project>/.agents/skills/<name>/ (dependency-managed copies).
  // Manifest features.optionalSkills is the always-selected baseline; opts.skills only preserves
  // compatibility with callers that explicitly name an already-default skill.
  // Copy semantics reuse 'file' evaluation: equal→skip, edited/foreign→conflict on init, while
  // upgrade marks declared files as managed and refreshes them; user self-installed additions stay.
  // Removal of a no-longer-selected skill and managed/user bookkeeping are deferred
  // (REQUIREMENTS v1.0 §7 DP-F / DP-G).
  const wanted = new Set([...(pack.features.optionalSkills || []), ...(opts.skills || [])])
  const skillsDir = join(pack.dir, 'skills')
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
  return { scope: 'project', projectRoot, mode: 'init', entries }
}

function statePath(projectRoot, targetAbs) {
  return relative(projectRoot, targetAbs).split(sep).join('/')
}

function effectiveFeatures(pack, opts) {
  return Object.assign({}, pack.features || {}, opts.features || {})
}

function isNotesExplainer(rel) {
  const name = rel.split('/').pop()
  return name === 'README.md' || name === 'README.zh.md' || name === 'README.i18n.yaml' || name === 'AGENTS.md'
}

function stateRecordByPath(state) {
  return new Map((state?.files || []).map(record => [record.path, record]))
}

function stateSegmentByKey(state) {
  return new Map((state?.segments || []).map(record => [record.target + '|' + record.id, record]))
}

function annotateFile(entry, projectRoot, ownership, sourceRel, sourceSha256) {
  entry.ownership = ownership
  entry.statePath = statePath(projectRoot, entry.targetAbs)
  entry.sourceRel = sourceRel || null
  entry.sourceSha256 = sourceSha256 || contentSha256(entry.content)
  return entry
}

function staleFileEntry(projectRoot, record, targetAbs, note) {
  return {
    kind: 'file-remove',
    id: 'stale:' + record.kind + ':' + record.path,
    targetAbs,
    statePath: record.path,
    label: record.path,
    home: join(projectRoot, '.dsh-rules'),
    expectHash: record.installedSha256 || null,
    staleRecord: record,
    ownership: record.kind,
    note
  }
}

function ownershipConflictEntry(projectRoot, targetAbs, note) {
  return {
    kind: 'ownership-conflict',
    id: 'ownership:' + statePath(projectRoot, targetAbs),
    targetAbs,
    label: statePath(projectRoot, targetAbs),
    ownership: 'unknown',
    note
  }
}

async function annotateInitOwnership(pack, projectRoot, plan) {
  const rowById = new Map(pack.rows.map(row => [row.id, row]))
  const skillHashByPath = new Map()
  for (const skill of pack.skills || []) {
    for (const file of skill.files || []) skillHashByPath.set(skill.name + '/' + file.path, file.sha256)
  }
  for (const entry of plan.entries) {
    if (entry.kind === 'segment') {
      const row = rowById.get(entry.id)
      entry.ownership = 'rule-segment'
      entry.target = 'AGENTS.md'
      entry.sourceRel = row?.rel || null
      entry.sourceSha256 = row?.actualSha256 || contentSha256(entry.body || '')
      entry.installedSha256 = entry.body === null ? null : contentSha256(makeSegment(entry.id, entry.body))
      continue
    }
    if (entry.kind !== 'file') continue
    const rel = statePath(projectRoot, entry.targetAbs)
    if (rel === 'docs/AGENTS.md') entry.ownership = 'generated-doc'
    else if (rel.startsWith('.dsh-rules/toolchain/')) entry.ownership = 'toolchain'
    else if (rel.startsWith('.agents/skills/')) entry.ownership = 'skill'
    else if (rel.startsWith('.agents/notes/') && isNotesExplainer(rel.slice('.agents/notes/'.length))) entry.ownership = 'notes-explainer'
    else continue
    entry.statePath = rel
    if (entry.id.startsWith('notes-skeleton:')) entry.sourceRel = 'notes-skeleton/' + entry.id.slice('notes-skeleton:'.length)
    else if (entry.id.startsWith('skill:')) entry.sourceRel = 'skills/' + entry.id.slice('skill:'.length).replace(/^[^:]+:/, (m) => m.slice(0, -1) + '/')
    else if (entry.id === 'toolchain:package.json') entry.sourceRel = 'toolchain/spec.json'
    else if (entry.id.startsWith('toolchain:')) entry.sourceRel = 'toolchain/' + entry.id.slice('toolchain:'.length).replace(/:([^:]*)$/, '/$1')
    else if (entry.id.startsWith('pack:')) entry.sourceRel = rowById.get(entry.id.slice('pack:'.length))?.rel || null
    const skillSource = entry.id.startsWith('skill:')
      ? skillHashByPath.get(entry.id.slice('skill:'.length).replace(':', '/'))
      : null
    const noteSource = entry.id.startsWith('notes-skeleton:')
      ? pack.rows.find((row) => row.rel === 'notes-skeleton/' + entry.id.slice('notes-skeleton:'.length))?.actualSha256
      : null
    let derivedSource = null
    if (entry.id === 'toolchain:package.json') {
      try { derivedSource = contentSha256(await readFile(join(pack.dir, 'toolchain/spec.json'), 'utf8')) } catch { }
    }
    entry.sourceSha256 = skillSource || noteSource || derivedSource || contentSha256(entry.content)
  }
  return plan
}

/** Build an upgrade plan with explicit ownership and state-aware stale-file handling. */
async function planUpgradeProject(pack, projectRoot, opts, stateInfo) {
  const entries = []
  const staleRecords = []
  const staleSegments = []
  const scheduledStalePaths = new Set()
  const scheduledLegacyPaths = new Set()
  const desiredPaths = new Set()
  const desiredSegments = new Set()
  const state = stateInfo?.problem ? null : stateInfo?.state
  const stateFiles = stateRecordByPath(state)
  const stateSegments = stateSegmentByKey(state)
  const enabledPairing = featureEnabled(pack, opts, 'bilingualPairing')
  const addFile = (entry) => { entry.upgradeManaged = true; desiredPaths.add(entry.statePath); entries.push(entry) }
  if (stateInfo?.problem) entries.push(ownershipConflictEntry(projectRoot, stateInfo.path, stateInfo.problem))

  // Notes: only explanation files are plugin-owned on upgrade. Dated notes, manifest, and
  // user-created files are intentionally absent from this plan.
  let skeletonFiles = []
  try { skeletonFiles = await listFiles(join(pack.dir, 'notes-skeleton')) } catch { }
  for (const f of skeletonFiles) {
    if (f.rel.split(sep).pop() === '.gitkeep' || !isNotesExplainer(f.rel)) continue
    const targetAbs = join(projectRoot, '.agents', 'notes', f.rel)
    const source = await readFile(f.abs, 'utf8')
    const sourceContent = cleanSource(source)
    const isPair = f.rel.endsWith('.zh.md') || f.rel.endsWith('.i18n.yaml')
    if (isPair && !enabledPairing) {
      let present = false
      try { present = (await stat(targetAbs)).isFile() } catch { }
      if (!present) continue
      const record = stateFiles.get(statePath(projectRoot, targetAbs))
      if (!record) {
        if (!state) entries.push({
          kind: 'file-remove', id: 'legacy-notes-remove:' + f.rel, targetAbs,
          label: statePath(projectRoot, targetAbs), home: join(projectRoot, '.agents', 'notes'),
          expect: sourceContent, legacyDeclared: true,
          note: 'legacy declared bilingual explainer; pairing disabled'
        })
        else entries.push(ownershipConflictEntry(projectRoot, targetAbs, 'bilingual explainer has no ownership record; kept'))
      } else {
        const entry = staleFileEntry(projectRoot, record, targetAbs, 'bilingual pairing disabled')
        scheduledStalePaths.add(record.path)
        staleRecords.push({ ...record, targetAbs, id: entry.id })
        entries.push(entry)
      }
      continue
    }
    let content = sourceContent
    if (f.rel === 'README.md' && !enabledPairing) content = removeDisabledNotePairLinks(content)
    addFile(annotateFile({ kind: 'file', id: 'notes-skeleton:' + f.rel, targetAbs, content, label: statePath(projectRoot, targetAbs) }, projectRoot, 'notes-explainer', 'notes-skeleton/' + f.rel, contentSha256(sourceContent)))
  }

  // Rule marker segments are always upgradeable. Outside text remains untouched by the
  // segment upsert operation; malformed/duplicate markers are rejected during evaluation.
  for (const row of pack.rows) {
    if (row.target !== 'AGENTS.md') continue
    const enabled = !row.feature || featureEnabled(pack, opts, row.feature)
    const body = enabled ? cleanSource(await readFile(row.sourceAbs, 'utf8')) : null
    const key = 'AGENTS.md|' + row.id
    if (body === null) {
      continue
    }
    desiredSegments.add(key)
    entries.push({ kind: 'segment', id: row.id, targetAbs: join(projectRoot, 'AGENTS.md'), target: 'AGENTS.md', body, label: 'AGENTS.md (segment ' + row.id + ')', feature: row.feature, enabled, ownership: 'rule-segment', sourceRel: row.rel, sourceSha256: row.actualSha256, installedSha256: contentSha256(makeSegment(row.id, body)), upgradeManaged: true })
  }

  // A rule segment can disappear or be renamed in a newer pack. Remove it only when the
  // previous state proves that this marker was installed by dsh-rules; unknown markers stay
  // untouched because their ownership cannot be inferred safely.
  for (const [key, previous] of stateSegments) {
    if (desiredSegments.has(key)) continue
    const id = previous.id
    const targetAbs = join(projectRoot, previous.target || 'AGENTS.md')
    staleSegments.push({ ...previous, targetAbs, id })
    entries.push({
      kind: 'segment', id, targetAbs, target: previous.target || 'AGENTS.md', body: null,
      label: (previous.target || 'AGENTS.md') + ' (segment ' + id + ')',
      note: 'no longer declared by current rule pack', ownership: 'rule-segment'
    })
  }

  // Only plugin-generated docs are whole-file managed on upgrade.
  for (const row of pack.rows) {
    if (row.target === 'AGENTS.md' || row.target !== 'docs/AGENTS.md') continue
    if (row.feature && !featureEnabled(pack, opts, row.feature)) {
      if (!state) {
        const targetAbs = join(projectRoot, row.target)
        const existing = await readText(targetAbs)
        const expected = cleanSource(await readFile(row.sourceAbs, 'utf8'))
        if (existing !== null) entries.push({ kind: 'file-remove', id: 'legacy-generated-doc-remove:' + row.id, targetAbs, label: row.target, home: projectRoot, expect: expected, legacyDeclared: true, note: 'legacy declared generated doc; feature disabled' })
      }
      continue
    }
    const targetAbs = join(projectRoot, row.target)
    const content = cleanSource(await readFile(row.sourceAbs, 'utf8'))
    addFile(annotateFile({ kind: 'file', id: 'pack:' + row.id, targetAbs, content, label: row.target, feature: row.feature, upgradeManaged: true }, projectRoot, 'generated-doc', row.rel, row.actualSha256))
  }

  // All declared project skills are managed dependencies. Unknown files in their directories
  // are not touched; state-backed removed files are handled below.
  const wanted = new Set(pack.features.optionalSkills || [])
  const skillsDir = join(pack.dir, 'skills')
  for (const name of wanted) {
    const src = join(skillsDir, name)
    try {
      for (const f of await listFiles(src)) {
        const raw = await readFile(f.abs, 'utf8')
        const content = cleanSource(raw)
        const targetAbs = join(projectRoot, '.agents', 'skills', name, f.rel)
        addFile(annotateFile({ kind: 'file', id: 'skill:' + name + ':' + f.rel, targetAbs, content, label: statePath(projectRoot, targetAbs), upgradeManaged: true }, projectRoot, 'skill', 'skills/' + name + '/' + f.rel, contentSha256(raw)))
      }
    } catch { entries.push({ kind: 'missing-skill', name, label: 'skill ' + name }) }
  }

  // Toolchain files and the derived package are managed by the pack. The package manager
  // owns node_modules/lockfiles, not this file plan.
  const tc = pack.toolchain
  let requiresInstall = false
  if (tc) {
    const home = join(projectRoot, tc.target)
    const umbrella = featureEnabled(pack, opts, tc.feature)
    const enabledGroups = new Set()
    if (umbrella) entries.push({ kind: 'dir', targetAbs: home, label: tc.target })
    for (const g of tc.groups) {
      const on = umbrella && featureEnabled(pack, opts, g.feature)
      if (on) enabledGroups.add(g.id)
      for (const f of g.files) {
        const targetAbs = join(home, f.rel)
        if (on) {
          const content = await readText(f.abs)
          if (content !== null) addFile(annotateFile({ kind: 'file', id: 'toolchain:' + g.id + ':' + f.rel, targetAbs, content, label: join(tc.target, f.rel), feature: g.feature, group: g.id, upgradeManaged: true }, projectRoot, 'toolchain', 'toolchain/' + g.id + '/' + f.rel, contentSha256(content)))
        } else if (!state) {
          // A disabled group is still declared by the current pack. On a legacy project we
          // can remove an exact current-pack copy, but a version-drifted or edited file remains
          // a conflict rather than being guessed as obsolete.
          const existing = await readText(targetAbs)
          const expected = await readText(f.abs)
          if (existing !== null && expected !== null) {
            scheduledLegacyPaths.add(statePath(projectRoot, targetAbs))
            entries.push({ kind: 'file-remove', id: 'legacy-toolchain-remove:' + g.id + ':' + f.rel, targetAbs, label: join(tc.target, f.rel), home, expect: expected, legacyDeclared: true, note: 'legacy declared file; group disabled' })
          }
        }
      }
    }
    const pkgPath = join(home, 'package.json')
    if (umbrella) {
      const content = composeToolchainPackageJson(tc, enabledGroups)
      const existing = await readText(pkgPath)
      requiresInstall = existing !== content
      let specHash = contentSha256(content)
      try { specHash = contentSha256(await readFile(join(pack.dir, 'toolchain/spec.json'), 'utf8')) } catch { }
      addFile(annotateFile({ kind: 'file', id: 'toolchain:package.json', targetAbs: pkgPath, content, label: join(tc.target, 'package.json'), group: 'package.json', upgradeManaged: true, managedUpdate: true }, projectRoot, 'toolchain', 'toolchain/spec.json', specHash))
    } else if (!state) {
      const existing = await readText(pkgPath)
      const expected = composeToolchainPackageJson(tc, new Set())
      if (existing !== null) {
        scheduledLegacyPaths.add(statePath(projectRoot, pkgPath))
        entries.push({ kind: 'file-remove', id: 'legacy-toolchain-remove:package.json', targetAbs: pkgPath, label: join(tc.target, 'package.json'), home, expect: expected, legacyDeclared: true, note: 'legacy declared package; docGates disabled' })
      }
    }

    // On a legacy project without ownership state, report existing unknown files instead of
    // guessing whether they are user additions or obsolete dsh-rules output.
    if (!state) {
      try {
        for (const f of await listFiles(home)) {
          if (f.rel.split('/').includes('node_modules') || /\.(lock|log)$/.test(f.rel)
            || ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'].includes(f.rel)) continue
          const path = statePath(projectRoot, join(home, f.rel))
          if (!desiredPaths.has(path) && !scheduledLegacyPaths.has(path)) entries.push(ownershipConflictEntry(projectRoot, join(home, f.rel), 'legacy toolchain file has no ownership record; kept'))
        }
      } catch { }
    }
  }

  if (!state) {
    // A declared skill directory may contain user additions. Keep them, but make the ambiguity
    // visible on the first migration; undeclared skill directories are entirely user-owned.
    for (const name of wanted) {
      const home = join(projectRoot, '.agents', 'skills', name)
      try {
        for (const f of await listFiles(home)) {
          const path = statePath(projectRoot, join(home, f.rel))
          if (!desiredPaths.has(path)) entries.push(ownershipConflictEntry(projectRoot, join(home, f.rel), 'legacy skill file has no ownership record; kept'))
        }
      } catch { }
    }
  }

  // Remove only files/segments proven to be owned by the prior state. A modified stale file
  // is retained as a conflict by evaluatePlan; unknown legacy files are reported, never deleted.
  for (const record of state?.files || []) {
    if (desiredPaths.has(record.path)) continue
    if (scheduledStalePaths.has(record.path)) continue
    if (!['toolchain', 'skill', 'generated-doc', 'notes-explainer'].includes(record.kind)) continue
    const targetAbs = join(projectRoot, record.path)
    let present = false
    try { present = (await stat(targetAbs)).isFile() } catch { }
    const entry = staleFileEntry(projectRoot, record, targetAbs, 'no longer declared by current rule pack')
    scheduledStalePaths.add(record.path)
    staleRecords.push({ ...record, targetAbs, id: entry.id })
    entries.push(entry)
    if (!present) continue
  }
  return {
    scope: 'project', projectRoot, mode: 'upgrade', entries, stateInfo,
    toolchainHome: tc ? join(projectRoot, tc.target) : null,
    staleRecords, staleSegments, effectiveFeatures: effectiveFeatures(pack, opts), requiresInstall,
    desiredPaths, desiredSegments
  }
}

/** Build either the legacy init plan or the state-aware upgrade plan. */
export async function planProject(pack, projectRoot, opts = {}) {
  if (opts.mode && !['init', 'upgrade'].includes(opts.mode)) throw new Error('unsupported plan mode: ' + opts.mode)
  const stateInfo = await readProjectState(projectRoot)
  if (opts.mode === 'upgrade') return planUpgradeProject(pack, projectRoot, opts, stateInfo)
  const plan = await planInitProject(pack, projectRoot, opts)
  plan.stateInfo = stateInfo
  return await annotateInitOwnership(pack, projectRoot, plan)
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
    if (e.kind === 'ownership-conflict') { out.push(Object.assign({}, e, { action: 'conflict' })); continue }
    const key = e.targetAbs + '|' + e.id
    if (seen.has(key)) { out.push(Object.assign({}, e, { action: 'skip', note: 'duplicate target' })); continue }
    seen.add(key)
    const existing = await readTarget(e.targetAbs)
    const oldHash = existing === null ? null : contentSha256(existing)
    const newHash = e.kind === 'file'
      ? contentSha256(e.content)
      : e.kind === 'segment' && e.body !== null
        ? contentSha256(makeSegment(e.id, e.body))
        : null
    const result = (extra) => Object.assign({}, e, { oldHash, newHash }, extra)
    if (e.kind === 'file') {
      if (existing === null) out.push(result({ action: 'create' }))
      else if (existing === e.content) out.push(result({ action: 'skip' }))
      else if (e.managedUpdate || e.upgradeManaged || e.managedContents?.includes(existing)) out.push(result({ action: 'update', preview: preview(e.label, existing, e.content) }))
      else out.push(result({ action: 'conflict', preview: preview(e.label, existing, e.content) }))
      continue
    }
    if (e.kind === 'file-remove') {
      if (existing === null) out.push(result({ action: 'skip', note: 'not present' }))
      else if (e.expectHash && contentSha256(existing) === e.expectHash) out.push(result({ action: 'remove' }))
      else if ((opts.force && (e.staleRecord || e.legacyDeclared)) || (e.expect !== null && existing === e.expect)) out.push(result({ action: 'remove' }))
      else out.push(result({ action: 'conflict', note: 'modified or version-drifted — kept; remove with --force or manually' }))
      continue
    }
    // segment
    const starts = existing ? (existing.match(new RegExp(startMarker(e.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0
    const ends = existing ? (existing.match(new RegExp(endMarker(e.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0
    if (starts > 1 || ends > 1 || starts !== ends || (starts === 1 && existing.indexOf(endMarker(e.id)) < existing.indexOf(startMarker(e.id)))) {
      out.push(result({ action: 'conflict', note: 'marker is missing, duplicated, or malformed' }))
      continue
    }
    const desired = e.body === null ? removeSegmentText(existing, e.id) : upsertSegmentText(existing, e.id, e.body)
    if (desired === (existing || '')) out.push(result({ action: 'skip' }))
    else if (e.body === null) out.push(result({ action: 'update', desired, preview: preview(e.label, existing, desired), note: 'segment removed (feature disabled)' }))
    else if (existing === null || existing.trim() === '') out.push(result({ action: 'create', desired }))
    else out.push(result({ action: 'update', desired, preview: preview(e.label, existing, desired) }))
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
        || ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'].includes(rel)
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
