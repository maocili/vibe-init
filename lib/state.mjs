// Project-local ownership state for vibe-init upgrades.
// This file describes tool-owned paths only; user notes and user-created files are never listed.
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { assertRealPathContained } from './path-safety.mjs'

export const STATE_SCHEMA_VERSION = 2
export const STATE_OWNER = 'vibe-init'
export const STATE_RELATIVE_PATH = '.vibe-init/state.json'

function safeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || isAbsolute(value) || /^[a-zA-Z]:/.test(value)) return false
  return value.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

function safeHash(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function safeSource(value) {
  return safeRelativePath(value)
}

function safeManagedFileRecord(record) {
  if (!record || !safeRelativePath(record.path) || typeof record.kind !== 'string') return false
  const path = record.path
  const allowed = record.kind === 'generated-doc' && path === 'docs/AGENTS.md'
    || record.kind === 'toolchain' && path.startsWith('.vibe-init/toolchain/')
    || record.kind === 'skill' && path.startsWith('.agents/skills/')
    || record.kind === 'notes-explainer'
      && path.startsWith('.agents/notes/')
      && ['README.md', 'README.zh.md', 'README.i18n.yaml', 'AGENTS.md'].includes(path.split('/').pop())
  return allowed && safeSource(record.source) && safeHash(record.sourceSha256) && safeHash(record.installedSha256)
}

function safeSegmentRecord(record) {
  return record && typeof record.id === 'string' && /^[a-zA-Z0-9._-]+$/.test(record.id)
    && record.target === 'AGENTS.md'
    && safeSource(record.source)
    && safeHash(record.sourceSha256)
    && safeHash(record.installedSha256)
}

export function contentSha256(text) {
  return createHash('sha256').update(String(text), 'utf8').digest('hex')
}

export async function readProjectState(projectRoot) {
  const path = join(projectRoot, STATE_RELATIVE_PATH)
  try {
    await assertRealPathContained(projectRoot, path, 'project state')
    const parsed = JSON.parse(await readFile(path, 'utf8'))
    if (!parsed || typeof parsed !== 'object') return { path, state: null, problem: 'state.json is not an object' }
    if (parsed.schemaVersion !== STATE_SCHEMA_VERSION) {
      return { path, state: parsed, problem: `unsupported state schema ${String(parsed.schemaVersion)}` }
    }
    if (parsed.owner !== STATE_OWNER) {
      return { path, state: parsed, problem: 'state.json owner must be vibe-init' }
    }
    if (typeof parsed.packVersion !== 'string' || parsed.packVersion.length === 0
      || !parsed.features || typeof parsed.features !== 'object' || Array.isArray(parsed.features)
      || !Array.isArray(parsed.files) || !Array.isArray(parsed.segments)) {
      return { path, state: parsed, problem: 'state.json must contain packVersion, features, files, and segments' }
    }
    const fileKeys = parsed.files.map((record) => record?.path)
    const segmentKeys = parsed.segments.map((record) => record?.target + '|' + record?.id)
    if (parsed.files.some((record) => !safeManagedFileRecord(record))
      || parsed.segments.some((record) => !safeSegmentRecord(record))
      || new Set(fileKeys).size !== fileKeys.length
      || new Set(segmentKeys).size !== segmentKeys.length) {
      return { path, state: parsed, problem: 'state.json contains an unsafe, duplicate, or unowned managed record' }
    }
    return { path, state: parsed, problem: null }
  } catch (error) {
    if (error && error.code === 'ENOENT') return { path, state: null, problem: null }
    return { path, state: null, problem: 'cannot parse state.json: ' + (error instanceof Error ? error.message : String(error)) }
  }
}

/** Atomically replace the project state after all requested migration work succeeds. */
export async function writeProjectState(projectRoot, state) {
  const path = join(projectRoot, STATE_RELATIVE_PATH)
  const temporary = path + '.tmp-' + process.pid
  await assertRealPathContained(projectRoot, path, 'project state')
  await assertRealPathContained(projectRoot, temporary, 'temporary project state')
  await mkdir(join(projectRoot, '.vibe-init'), { recursive: true })
  await writeFile(temporary, JSON.stringify(state, null, 2) + '\n', 'utf8')
  await rename(temporary, path)
  return path
}

export function emptyState(packVersion, features) {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    owner: STATE_OWNER,
    packVersion: packVersion ?? null,
    features: { ...(features || {}) },
    segments: [],
    files: []
  }
}

function fileKey(record) {
  return record.path
}

function segmentKey(record) {
  return record.target + '|' + record.id
}

/** Build the desired ownership snapshot from a plan without inspecting user-owned files. */
export function desiredStateFromPlan(plan) {
  const files = []
  const segments = []
  for (const entry of plan.entries || []) {
    if (entry.kind === 'segment' && entry.ownership === 'rule-segment' && entry.body !== null) {
      segments.push({
        id: entry.id,
        target: entry.target || 'AGENTS.md',
        source: entry.sourceRel || null,
        sourceSha256: entry.sourceSha256 || null,
        installedSha256: entry.installedSha256 || entry.sourceSha256 || null
      })
      continue
    }
    if (entry.kind !== 'file' || !entry.ownership) continue
    files.push({
      path: entry.statePath || entry.label,
      kind: entry.ownership,
      source: entry.sourceRel || null,
      sourceSha256: entry.sourceSha256 || contentSha256(entry.content),
      installedSha256: contentSha256(entry.content)
    })
  }
  files.sort((a, b) => a.path.localeCompare(b.path))
  segments.sort((a, b) => segmentKey(a).localeCompare(segmentKey(b)))
  return { files, segments }
}

/**
 * Merge a successful plan into the previous state. Conflicts retain the previous ownership
 * record so a later retry can still identify stale managed files.
 */
export function nextProjectState(plan, results, packVersion, features) {
  const previous = plan.stateInfo?.state || emptyState(packVersion, features)
  const fileMap = new Map((previous.files || []).map(record => [fileKey(record), { ...record }]))
  const segmentMap = new Map((previous.segments || []).map(record => [segmentKey(record), { ...record }]))
  const resultMap = new Map((results || []).map(result => [result.targetAbs + '|' + result.id, result]))
  const desired = desiredStateFromPlan(plan)

  for (const entry of plan.entries || []) {
    const result = resultMap.get(entry.targetAbs + '|' + entry.id)
    if (result && (result.action === 'conflict' || result.action === 'missing')) continue
    if (entry.kind === 'file' && entry.ownership) {
      const record = desired.files.find(candidate => candidate.path === (entry.statePath || entry.label))
      if (record) fileMap.set(fileKey(record), record)
    } else if (entry.kind === 'segment' && entry.ownership === 'rule-segment' && entry.body !== null) {
      const record = desired.segments.find(candidate => segmentKey(candidate) === (entry.target || 'AGENTS.md') + '|' + entry.id)
      if (record) segmentMap.set(segmentKey(record), record)
    }
  }

  for (const stale of plan.staleRecords || []) {
    const result = resultMap.get(stale.targetAbs + '|' + stale.id)
    if (result && (result.action === 'remove' || result.action === 'skip')) fileMap.delete(stale.path)
  }
  for (const stale of plan.staleSegments || []) {
    const result = resultMap.get(stale.targetAbs + '|' + stale.id)
    if (result && (result.action === 'update' || result.action === 'skip')) segmentMap.delete(stale.target + '|' + stale.id)
  }

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    owner: STATE_OWNER,
    packVersion: packVersion ?? null,
    features: { ...(features || {}) },
    segments: [...segmentMap.values()].sort((a, b) => segmentKey(a).localeCompare(segmentKey(b))),
    files: [...fileMap.values()].sort((a, b) => fileKey(a).localeCompare(fileKey(b)))
  }
}
