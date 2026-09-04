// dsh-rules pack loader — reads a versioned rule pack (manifest.json + source files).
// The pack is the single content source (DESIGN §3); this plugin never hardcodes rule text.
import { createHash } from 'node:crypto'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

export function sha256OfBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/** Hash a UTF-8 text string. */
export async function sha256File(file) {
  return sha256OfBytes(await readFile(file))
}

// Whole-line marker/management comments that are dropped from pack sources before they
// are materialized (planning headers "[实现期]" and legacy "dsh-rules:*" marker lines).
// The engine re-wraps every managed segment in its own id-based markers, so hand-written
// markers never reach consumers.
// HTML comments that carry pack-authoring guidance ("[实现期]/待填充/占位" planning headers
// and legacy "dsh-rules:*" marker lines) never reach consumers: they are stripped wherever they
// sit (top, mid-file, bottom). The engine re-wraps every managed segment in its own id markers.
const SINGLE_MARKER_RE = /^<!--\s*dsh-rules(?::[a-zA-Z0-9._-]+)?\s*(?::start|:end)?\s*-->$/
const PLANNING_RE = /待填充|\[实现期\]|^<!--\s*占位|^<!--\s*dsh-rules:feature/

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

/**
 * Load a toolchain declaration from the pack manifest + spec (docGates umbrella).
 * Returns null when the pack declares no toolchain; pushes problems on a broken one.
 * Groups are pre-enumerated so planning can gate each group by its feature key.
 */
async function loadToolchain(packDir, manifest, problems) {
  const cfg = manifest.toolchain
  if (!cfg || typeof cfg !== 'object') return null
  if (!cfg.spec || !cfg.target) { problems.push('toolchain: spec and target are required'); return null }
  const specPath = join(packDir, String(cfg.spec).replace(/^\/+/, ''))
  let spec
  try {
    spec = JSON.parse(await readFile(specPath, 'utf8'))
  } catch (error) {
    problems.push('toolchain: cannot parse spec ' + cfg.spec + ': ' + (error instanceof Error ? error.message : String(error)))
    return null
  }
  const specDir = dirname(specPath)
  const groups = []
  for (const g of spec.groups || []) {
    if (!g || !g.id || !g.src) { problems.push('toolchain spec: group needs id and src'); continue }
    const src = join(specDir, String(g.src))
    let files = []
    try { files = await listFiles(src) } catch { problems.push('toolchain spec: missing group dir ' + g.src); continue }
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
    target: String(cfg.target).replace(/^\/+/, ''),
    feature: spec.feature || 'docGates',
    packageJson: spec.packageJson || {},
    groups
  }
}

/**
 * Load and validate a pack directory. Returns { dir, version, features, rows, toolchain, manifest }.
 * rows = manifest.files resolved with: id, sourceAbs, rel, target, mode, feature, declaredSha256, actualSha256.
 * mode defaults to 'copy' (exact byte sync); other modes are segment-managed writes.
 */
export async function loadPack(packDir) {
  const manifestPath = join(packDir, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!manifest || typeof manifest !== 'object') throw new Error('invalid pack manifest (not an object)')
  const rows = []
  const problems = []
  for (const entry of manifest.files || []) {
    if (!entry || !entry.id || !entry.source || !entry.target) {
      problems.push('row missing id/source/target: ' + JSON.stringify(entry))
      continue
    }
    const rel = String(entry.source).replace(/^\/+/, '')
    const sourceAbs = join(packDir, rel)
    let actualSha256 = ''
    try {
      actualSha256 = await sha256File(sourceAbs)
    } catch {
      problems.push('missing source file for row "' + entry.id + '": ' + rel)
      continue
    }
    rows.push({
      id: entry.id,
      rel,
      sourceAbs,
      target: entry.target,
      mode: entry.mode || 'copy',
      feature: entry.feature || null,
      declaredSha256: entry.sha256 || '',
      actualSha256
    })
  }
  const toolchain = await loadToolchain(packDir, manifest, problems)
  return {
    dir: packDir,
    version: manifest.version,
    features: manifest.features || {},
    rows,
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
  await writeFile(join(packDir, 'manifest.json'), JSON.stringify(pack.manifest, null, 2) + '\n', 'utf8')
  return { changed, version: pack.version, count: pack.rows.length, problems: pack.problems }
}

/** Recursively list files under a directory (sorted, deterministic). */
export async function listFiles(dir, prefix = '') {
  const out = []
  for (const name of (await readdir(dir)).sort()) {
    const abs = join(dir, name)
    const rel = prefix ? prefix + '/' + name : name
    const st = await stat(abs)
    if (st.isDirectory()) out.push(...(await listFiles(abs, rel)))
    else out.push({ rel, abs })
  }
  return out
}
