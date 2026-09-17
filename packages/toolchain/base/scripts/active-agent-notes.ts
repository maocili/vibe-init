/** Pure completeness and consistency checks for active bilingual Agent Notes. */

import { createHash } from 'node:crypto'
import { existsSync, globSync, readFileSync } from 'node:fs'
import { basename, resolve, sep } from 'node:path'
import type { AgentNote } from './agent-note-tree.ts'

function gitBlobHash(content: Buffer): string {
  const hash = createHash('sha1')
  hash.update(`blob ${content.byteLength}\0`)
  hash.update(content)
  return hash.digest('hex')
}

function pairMeta(content: string): Map<string, string> | undefined {
  const entries = new Map<string, string>()
  for (const line of content.split('\n')) {
    if (line === '' || line.startsWith('#')) continue
    const match = /^([^:#]+\.md): ([0-9a-f]{40})$/.exec(line)
    if (match?.[1] === undefined || match[2] === undefined || entries.has(match[1])) return undefined
    entries.set(match[1], match[2])
  }
  return entries
}

/**
 * Validate every active note as a complete, current triplet when the notes
 * corpus declares bilingual pairing through the managed README link. The
 * English-only README variant removes that link when pairing is disabled.
 */
export function validateActiveNoteTriplets(noteRoot: string, notes: readonly AgentNote[]): string[] {
  const statePath = resolve(noteRoot, '../..', '.vibe-init/state.json')
  if (existsSync(statePath)) {
    try {
      const state: unknown = JSON.parse(readFileSync(statePath, 'utf8'))
      if (typeof state === 'object' && state !== null && 'features' in state
        && typeof state.features === 'object' && state.features !== null
        && 'bilingualPairing' in state.features && state.features.bilingualPairing === false) return []
    } catch { /* A malformed state is owned by the initializer; do not let it disable this gate. */ }
  }
  const readme = resolve(noteRoot, 'README.md')
  if (!existsSync(readme) || !readFileSync(readme, 'utf8').includes('(README.i18n.yaml)')) return []

  const errors: string[] = []
  const sourceStems = new Set(notes.map(note => note.rel.slice(0, -'.md'.length)))
  for (const pattern of ['{proposed,implemented,rejected}/**/*.zh.md', '{proposed,implemented,rejected}/**/*.i18n.yaml']) {
    for (const match of globSync(pattern, { cwd: noteRoot })) {
      const rel = match.split(sep).join('/')
      const stem = rel.endsWith('.zh.md') ? rel.slice(0, -'.zh.md'.length) : rel.slice(0, -'.i18n.yaml'.length)
      if (!sourceStems.has(stem)) errors.push(`pairing: ${rel} — active Agent Note counterpart has no English source`)
    }
  }

  for (const note of notes) {
    const stem = note.rel.slice(0, -'.md'.length)
    const sourcePath = `${stem}.md`
    const zhPath = `${stem}.zh.md`
    const metaPath = `${stem}.i18n.yaml`
    const missing = [zhPath, metaPath].filter(path => !existsSync(resolve(noteRoot, path)))
    if (missing.length > 0) {
      errors.push(`pairing: ${stem} — incomplete active triplet; missing ${missing.join(', ')}`)
      continue
    }

    const source = readFileSync(resolve(noteRoot, sourcePath))
    const zh = readFileSync(resolve(noteRoot, zhPath))
    const meta = pairMeta(readFileSync(resolve(noteRoot, metaPath), 'utf8'))
    const sourceBase = basename(sourcePath)
    const zhBase = basename(zhPath)
    if (meta === undefined || meta.size !== 2
      || meta.get(sourceBase) !== gitBlobHash(source)
      || meta.get(zhBase) !== gitBlobHash(zh)) {
      errors.push(`pairing: ${metaPath} — consistency record must contain the current Git blob hashes of both active sides`)
    }
  }
  return errors
}
