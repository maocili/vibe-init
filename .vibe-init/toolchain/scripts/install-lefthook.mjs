#!/usr/bin/env node
// vibe-init consumer lefthook installer.
// Runs as the toolchain package.json postinstall (pnpm install inside .vibe-init/toolchain).
// Writes a vibe-init-owned pre-commit hook config at the git root and installs git hooks.
// Never overwrites a foreign lefthook.yml: reports the conflict and exits cleanly.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOME = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MARKER = '# vibe-init managed (install-lefthook.mjs)'
const CONFIG = [
  MARKER,
  '# Remove this line (and the git hooks lefthook installs) to uninstall.',
  'pre-commit:',
  '  parallel: true',
  '  commands:',
  '    doc-gates:',
  '      root: .vibe-init/toolchain',
  '      run: pnpm run doc-sync',
  '      skip:',
  '        - merge',
  '        - rebase',
  '',
].join('\n')

function gitRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
}

function lefthookBin() {
  return join(HOME, 'node_modules', '.bin', 'lefthook')
}

try {
  const root = gitRoot()
  const configPath = join(root, 'lefthook.yml')
  if (existsSync(configPath)) {
    const existing = readFileSync(configPath, 'utf8')
    if (!existing.includes(MARKER)) {
      console.error(`[install-lefthook] ${configPath} exists without the vibe-init marker — not overwriting. Merge the pre-commit block below yourself or delete the file and re-run pnpm install:`)
      console.error(CONFIG)
      process.exit(0)
    }
  } else {
    writeFileSync(configPath, CONFIG, 'utf8')
    console.error(`[install-lefthook] wrote ${configPath}`)
  }
  const bin = lefthookBin()
  if (!existsSync(bin)) {
    console.error('[install-lefthook] lefthook binary missing — run pnpm install (lefthook is a devDependency) and re-run postinstall.')
    process.exit(0)
  }
  execFileSync(bin, ['install'], { cwd: root, stdio: 'inherit' })
  console.error('[install-lefthook] lefthook hooks installed (pre-commit runs the vibe-init doc gates).')
} catch (error) {
  console.error(`[install-lefthook] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
