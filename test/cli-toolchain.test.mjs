// dsh-rules CLI docGates toolchain integration (spawn the real bin).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BIN = join(ROOT, 'bin', 'dsh-rules.mjs')
let TMP

function run(args, opts = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8', ...opts,
    env: { ...process.env, DSH_RULES_SKIP_TOOLCHAIN_INSTALL: '1', ...(opts.env || {}) }
  })
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' }
}

before(() => { TMP = mkdtempSync(join(ROOT, '.cli-tc-')) })
after(() => { rmSync(TMP, { recursive: true, force: true }) })

function newProject(name) {
  const dir = join(TMP, name)
  mkdirSync(join(dir, '.git'), { recursive: true })
  writeFileSync(join(dir, 'AGENTS.md'), '## Demo project\n')
  return dir
}

test('CLI: default init materializes the docGates toolchain; disable removes it; re-enable restores', () => {
  const proj = newProject('cli-tc')
  const init = run(['init', '--project', proj, '--yes'])
  assert.equal(init.code, 0)
  const home = join(proj, '.dsh-rules', 'toolchain')
  assert.ok(existsSync(join(home, 'package.json')))
  assert.ok(existsSync(join(home, 'scripts', 'verify-md-links.ts')))
  assert.ok(existsSync(join(home, 'scripts', 'install-lefthook.mjs')))
  assert.ok(!existsSync(join(home, 'scripts', 'verify-mermaid.ts')))
  const pkg = JSON.parse(readFileSync(join(home, 'package.json'), 'utf8'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-agent-note-format'))

  const off = run(['upgrade', '--project', proj, '--feature', 'docGates=false', '--yes'])
  assert.equal(off.code, 0)
  assert.ok(!existsSync(join(home, 'scripts', 'verify-md-links.ts')))
  assert.ok(!existsSync(join(home, 'package.json')))

  const on = run(['upgrade', '--project', proj, '--yes'])
  assert.equal(on.code, 0)
  assert.ok(existsSync(join(home, 'scripts', 'verify-md-links.ts')))
  const again = run(['upgrade', '--project', proj, '--yes'])
  assert.equal(again.code, 0)
  assert.ok(again.out.includes('nothing to do'))
})
