// vibe-init pack loader — reads a versioned rule pack (manifest.json + source files).
// The pack is the single content source; the runtime never hardcodes rule text.
import { createHash } from 'node:crypto'
import { readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'
import { assertRealPathContained } from './path-safety.mjs'

export function sha256OfBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/** Hash a UTF-8 text string. */
export async function sha256File(file) {
  return sha256OfBytes(await readFile(file))
}

// Pack-authoring guidance and vibe-init management markers never reach consumers.
// The engine wraps each managed segment with deterministic id-based markers.
const SINGLE_MARKER_RE = /^<!--\s*vibe-init(?::[a-zA-Z0-9._-]+)?\s*(?::start|:end)?\s*-->$/
const PLANNING_RE = /待填充|\[实现期\]|^<!--\s*占位|^<!--\s*vibe-init:feature/

/**
 * Clean pack source text before materialization:
 *  1. drop whole-line HTML-comment chunks that are planning/marker comments;
 *  2. drop blank lines left adjacent to removed chunks (collapse 2+ blank lines to one);
 *  3. normalize trailing newline.
 * Normal markdown/comments that are not planning markers are preserved verbatim.
 */
export function cleanSource(text) {
  if (text == null) return ''
  const lines = text.split(/\r?\n/)
  const kept = []
  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (!trimmed.startsWith('<!--')) { kept.push(lines[i]); i++; continue }
    // gather the whole comment chunk (may span several lines until '-->')
    const chunk = [lines[i]]
    i++
    while (i < lines.length && !chunk[chunk.length - 1].includes('-->')) { chunk.push(lines[i]); i++ }
    const chunkText = chunk.join('\n').trim()
    const singleMarker = chunk.length === 1 && SINGLE_MARKER_RE.test(lines[i - 1].trim())
    const planning = PLANNING_RE.test(chunkText)
    if (!singleMarker && !planning) kept.push(...chunk)
  }
  // remove leading blank lines, then collapse runs of 2+ blank lines
  let out = kept.join('\n')
  out = out.replace(/^(?:\s*\n)+/, '')
  out = out.replace(/\n{3,}/g, '\n\n')
  out = out.trimEnd()
  return out === '' ? '' : out + '\n'
}

export function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || isAbsolute(value) || /^[a-zA-Z]:/.test(value)) return false
  return value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

/**
 * Load a toolchain declaration from the pack manifest + spec (docGates umbrella).
 * Returns null when the pack declares no toolchain; pushes problems on a broken one.
 * Groups are pre-enumerated so planning can gate each group by its feature key.
 */
async function loadToolchain(packDir, manifest, problems) {
  const cfg = manifest.toolchain
  if (!cfg || typeof cfg !== 'object') return null
  if (!cfg.spec || typeof cfg.target !== 'string') { problems.push('toolchain: spec and target are required'); return null }
  const manifestTargetSafe = isSafeRelativePath(cfg.target)
  if (!manifestTargetSafe) problems.push('toolchain: manifest target must be a safe relative path: ' + JSON.stringify(cfg.target))
  const specValueSafe = isSafeRelativePath(cfg.spec)
  if (!specValueSafe) {
    problems.push('toolchain: spec must be a safe relative path: ' + JSON.stringify(cfg.spec))
    return null
  }
  const specPath = join(packDir, cfg.spec)
  let spec
  try {
    await assertRealPathContained(packDir, specPath, 'toolchain spec ' + cfg.spec)
    spec = JSON.parse(await readFile(specPath, 'utf8'))
  } catch (error) {
    problems.push('toolchain: cannot parse safe spec ' + cfg.spec + ': ' + (error instanceof Error ? error.message : String(error)))
    return null
  }
  const specTargetSafe = isSafeRelativePath(spec.target)
  if (!specTargetSafe) problems.push('toolchain: spec target must be a safe relative path: ' + JSON.stringify(spec.target))
  if (cfg.target !== spec.target) problems.push('toolchain: manifest target must exactly match spec.target')
  if (!manifestTargetSafe || !specTargetSafe || cfg.target !== spec.target) return null
  const specDir = dirname(specPath)
  const groups = []
  for (const g of spec.groups || []) {
    if (!g || !g.id || !g.src) { problems.push('toolchain spec: group needs id and src'); continue }
    if (!isSafeRelativePath(g.src)) {
      problems.push('toolchain spec: group ' + g.id + ' src must be a safe relative path: ' + JSON.stringify(g.src))
      continue
    }
    const src = join(specDir, g.src)
    let files = []
    try { files = await listFiles(src, '', packDir) } catch (error) {
      problems.push('toolchain spec: unsafe or missing group dir ' + g.src + ': ' + (error instanceof Error ? error.message : String(error)))
      continue
    }
    groups.push({
      id: String(g.id),
      feature: g.feature || null,
      src,
      files,
      verify: Array.isArray(g.verify) ? g.verify : [],
      scripts: g.scripts || {},
      deps: g.deps || {}
    })
  }
  return {
    target: cfg.target,
    feature: spec.feature || 'docGates',
    packageJson: spec.packageJson || {},
    groups
  }
}

/** Enumerate every distributable project skill and its content-addressed files. */
async function collectSkills(packDir, problems) {
  const skillsDir = join(packDir, 'skills')
  let entries = []
  try {
    await assertRealPathContained(packDir, skillsDir, 'skills root')
    entries = await readdir(skillsDir)
  } catch (error) {
    problems.push('skills: cannot enumerate safe skills root: ' + (error instanceof Error ? error.message : String(error)))
    return []
  }
  const skills = []
  for (const name of entries.sort((a, b) => a.localeCompare(b))) {
    const dir = join(skillsDir, name)
    let files
    try {
      await assertRealPathContained(packDir, dir, 'skill ' + name)
      if (!(await stat(dir)).isDirectory()) continue
      files = await listFiles(dir, '', packDir)
    } catch (error) {
      problems.push('skills: unsafe or unreadable skill ' + name + ': ' + (error instanceof Error ? error.message : String(error)))
      continue
    }
    if (!files.some(file => file.rel === 'SKILL.md')) continue
    skills.push({
      name,
      files: await Promise.all(files.map(async file => ({ path: file.rel, sha256: await sha256File(file.abs) }))),
    })
  }
  return skills
}

function skillManifestProblems(actual, declared) {
  if (!Array.isArray(declared)) return ['skills: manifest.skills is required']
  const expected = new Map(declared.filter(entry => entry && typeof entry.name === 'string').map(entry => [entry.name, entry]))
  const problems = []
  for (const skill of actual) {
    const listed = expected.get(skill.name)
    if (!listed || !Array.isArray(listed.files)) {
      problems.push(`skills: ${skill.name} is not declared in manifest.skills`)
      continue
    }
    const listedFiles = new Map(listed.files.filter(file => file && typeof file.path === 'string').map(file => [file.path, file.sha256]))
    for (const file of skill.files) {
      if (listedFiles.get(file.path) !== file.sha256) problems.push(`skills: ${skill.name}/${file.path} sha256 drift`)
      listedFiles.delete(file.path)
    }
    for (const path of listedFiles.keys()) problems.push(`skills: ${skill.name}/${path} is missing from pack`)
    expected.delete(skill.name)
  }
  for (const name of expected.keys()) problems.push(`skills: ${name} is declared but missing from pack`)
  return problems
}

/** The project pack deliberately has no opt-in skill tier: every shipped skill is a default. */
function defaultSkillProblems(actual, declared) {
  if (!Array.isArray(declared)) return ['features.optionalSkills must be an array']
  const names = new Set(actual.map(skill => skill.name))
  const seen = new Set()
  const problems = []
  for (const name of declared) {
    if (typeof name !== 'string' || !name) { problems.push('features.optionalSkills contains an invalid name'); continue }
    if (seen.has(name)) { problems.push(`features.optionalSkills declares ${name} more than once`); continue }
    seen.add(name)
    if (!names.has(name)) problems.push(`features.optionalSkills declares missing skill ${name}`)
  }
  for (const name of names) if (!seen.has(name)) problems.push(`skills: ${name} is not default-installed`)
  return problems
}

/**
 * Load and validate a pack directory. Returns { dir, version, features, rows, toolchain, manifest }.
 * rows = manifest.files resolved with: id, sourceAbs, rel, target, mode, feature, declaredSha256, actualSha256.
 * mode defaults to 'copy' (exact byte sync); other modes are segment-managed writes.
 */
export async function loadPack(packDir) {
  const manifestPath = join(packDir, 'manifest.json')
  await assertRealPathContained(packDir, manifestPath, 'pack manifest')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!manifest || typeof manifest !== 'object') throw new Error('invalid pack manifest (not an object)')
  const rows = []
  const problems = []
  for (const entry of manifest.files || []) {
    if (!entry || !entry.id || !entry.source || !entry.target) {
      problems.push('row missing id/source/target: ' + JSON.stringify(entry))
      continue
    }
    const source = entry.source
    const target = entry.target
    if (!isSafeRelativePath(source)) {
      problems.push('row "' + entry.id + '": source must be a safe relative path: ' + JSON.stringify(source))
      continue
    }
    if (!isSafeRelativePath(target)) {
      problems.push('row "' + entry.id + '": target must be a safe relative path: ' + JSON.stringify(target))
      continue
    }
    const rel = source
    const sourceAbs = join(packDir, rel)
    let actualSha256 = ''
    try {
      await assertRealPathContained(packDir, sourceAbs, 'row "' + entry.id + '" source')
      actualSha256 = await sha256File(sourceAbs)
    } catch (error) {
      problems.push('unsafe or missing source file for row "' + entry.id + '": ' + rel + ': ' + (error instanceof Error ? error.message : String(error)))
      continue
    }
    rows.push({
      id: entry.id,
      rel,
      sourceAbs,
      target,
      mode: entry.mode || 'copy',
      feature: entry.feature || null,
      declaredSha256: entry.sha256 || '',
      actualSha256
    })
    if (entry.sha256 !== actualSha256) problems.push('row "' + entry.id + '": sha256 drift')
  }
  const skills = await collectSkills(packDir, problems)
  problems.push(...skillManifestProblems(skills, manifest.skills))
  problems.push(...defaultSkillProblems(skills, manifest.features?.optionalSkills))
  const toolchain = await loadToolchain(packDir, manifest, problems)
  return {
    dir: packDir,
    version: manifest.version,
    features: manifest.features || {},
    rows,
    skills,
    toolchain,
    manifest,
    problems
  }
}

/** Refresh manifest.json sha256 fields to the current source files. Returns changed count. */
export async function hashPack(packDir) {
  const pack = await loadPack(packDir)
  let changed = 0
  for (const row of pack.rows) {
    const entry = pack.manifest.files.find((f) => f && f.id === row.id)
    if (entry && entry.sha256 !== row.actualSha256) { entry.sha256 = row.actualSha256; changed++ }
  }
  const renderedSkills = pack.skills.map(skill => ({ name: skill.name, files: skill.files }))
  if (JSON.stringify(pack.manifest.skills || null) !== JSON.stringify(renderedSkills)) {
    pack.manifest.skills = renderedSkills
    changed++
  }
  const manifestPath = join(packDir, 'manifest.json')
  await assertRealPathContained(packDir, manifestPath, 'pack manifest')
  await writeFile(manifestPath, JSON.stringify(pack.manifest, null, 2) + '\n', 'utf8')
  // Re-read after the write so the CLI reports the repaired state, not the
  // pre-refresh drift which it has just fixed.
  const refreshed = await loadPack(packDir)
  return {
    changed,
    version: refreshed.version,
    count: refreshed.rows.length + refreshed.skills.reduce((sum, skill) => sum + skill.files.length, 0),
    problems: refreshed.problems
  }
}

/**
 * Recursively list files under a directory (sorted, deterministic, loop-free).
 * With an explicit `containmentRoot` every enumerated path must resolve inside
 * that root's real path (used for pack-sourced content, which may not escape the
 * pack). With the default `null` containment this is a lexical-only enumeration
 * (used for read-only project scans of homes that legitimately contain package
 * manager symlinks such as `node_modules/.pnpm`).
 */
export async function listFiles(dir, prefix = '', containmentRoot = null, visited = new Set()) {
  let realDir = null
  if (containmentRoot !== null) {
    await assertRealPathContained(containmentRoot, dir, prefix || 'directory')
    realDir = await realpath(dir)
    if (visited.has(realDir)) throw new Error('recursive directory link at ' + (prefix || '.'))
    visited.add(realDir)
  }
  try {
    const out = []
    for (const name of (await readdir(dir)).sort()) {
      const abs = join(dir, name)
      const rel = prefix ? prefix + '/' + name : name
      if (containmentRoot !== null) await assertRealPathContained(containmentRoot, abs, rel)
      const st = await stat(abs)
      if (st.isDirectory()) out.push(...(await listFiles(abs, rel, containmentRoot, visited)))
      else if (st.isFile()) out.push({ rel, abs })
    }
    return out
  } finally {
    if (realDir !== null) visited.delete(realDir)
  }
}
