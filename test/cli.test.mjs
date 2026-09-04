// dsh-rules CLI integration tests (node:test): spawn the real bin.
// Uses a temp project fixture and a temp copy of the pack (real packages is never mutated;
// hash runs only against the temp copy).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, chmodSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installToolchainIfNeeded } from '../lib/cli.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BIN = join(ROOT, 'bin', 'dsh-rules.mjs')
const REAL_PACK = join(ROOT, 'packages')
let TMP

function run(args, opts = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8', ...opts,
    env: { ...process.env, DSH_RULES_SKIP_TOOLCHAIN_INSTALL: '1', ...(opts.env || {}) }
  })
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' }
}

before(() => { TMP = mkdtempSync(join(ROOT, '.cli-smoke-')) })
after(() => { rmSync(TMP, { recursive: true, force: true }) })

function newProject(name) {
  const dir = join(TMP, name)
  mkdirSync(join(dir, '.git'), { recursive: true })
  writeFileSync(join(dir, 'AGENTS.md'), '## Demo project\n')
  return dir
}

test('help lists project-only command surface; unknown command exits 2', () => {
  const h = run(['help'])
  assert.equal(h.code, 0)
  assert.ok(h.out.includes('REQUIREMENTS v1.0'))
  assert.ok(!h.out.includes('install-global'))
  const u = run(['bogus-command'])
  assert.equal(u.code, 2)
})

test('install-global is retired with an explicit error', () => {
  const r = run(['install-global', '--yes'], { cwd: TMP })
  assert.equal(r.code, 2)
  assert.ok(r.err.includes('retired'))
})

test('init is idempotent via the CLI and status has no global scope', () => {
  const proj = newProject('cli-init')
  const first = run(['init', '--project', proj, '--yes'])
  assert.equal(first.code, 0)
  assert.ok(first.out.includes('applied'))
  const second = run(['init', '--project', proj, '--yes'])
  assert.equal(second.code, 0)
  assert.ok(second.out.includes('nothing to do'))
  // three default segments + skeleton materialized
  const root = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.ok(root.includes('project-standing-orders-block'))
  assert.ok(root.includes('feature-text-link-management'))
  assert.ok(root.includes('feature-doc-budgets'))
  assert.ok(!root.includes('feature-bilingual-docs'))
  assert.ok(existsSync(join(proj, '.agents', 'notes', 'README.md')))
  assert.ok(existsSync(join(proj, '.agents', 'skills', 'archive-agent-notes', 'SKILL.md')))
  assert.ok(existsSync(join(proj, '.agents', 'skills', 'trim-reasoning-leakage', 'SKILL.md')))
  const state = JSON.parse(readFileSync(join(proj, '.dsh-rules', 'state.json'), 'utf8'))
  assert.equal(state.schemaVersion, 1)
  assert.equal(state.packVersion, '0.1.0-draft')
  const st = run(['status', '--project', proj, '--json'])
  assert.equal(st.code, 0)
  const json = JSON.parse(st.out)
  assert.ok('project' in json && !('global' in json))
  const aud = run(['audit', '--project', proj, '--json'])
  assert.equal(aud.code, 0)
  const audJson = JSON.parse(aud.out)
  assert.deepEqual(audJson.notes.filter((n) => n.what === 'pack-drift'), [])
  const staleState = JSON.parse(readFileSync(join(proj, '.dsh-rules', 'state.json'), 'utf8'))
  staleState.packVersion = 'old-pack'
  writeFileSync(join(proj, '.dsh-rules', 'state.json'), JSON.stringify(staleState, null, 2) + '\n')
  const staleStatus = JSON.parse(run(['status', '--project', proj, '--json']).out)
  assert.ok(staleStatus.notes.some((n) => n.what === 'state-outdated'))
})

test('list-skills reports the default project skill set', () => {
  const listed = run(['list-skills'])
  assert.equal(listed.code, 0)
  assert.ok(listed.out.includes('default project skills'))
  assert.ok(listed.out.includes('archive-agent-notes'))
  assert.ok(listed.out.includes('record-browser-gif'))
  assert.ok(listed.out.includes('translate-docs'))
})

test('upgrade installs toolchain dependencies when package composition changes', async () => {
  let call = null
  await installToolchainIfNeeded(
    { requiresInstall: true, toolchainHome: '/tmp/example/.dsh-rules/toolchain' },
    '/tmp/example',
    async (...args) => { call = args; return { stdout: '', stderr: '' } }
  )
  assert.deepEqual(call.slice(0, 2), ['pnpm', ['-C', '/tmp/example/.dsh-rules/toolchain', 'install']])
  assert.equal(call[2].cwd, '/tmp/example')
})

test('toolchain dependency failure is surfaced for a retry', async () => {
  await assert.rejects(
    installToolchainIfNeeded(
      { requiresInstall: true, toolchainHome: '/tmp/example/.dsh-rules/toolchain' },
      '/tmp/example',
      async () => { throw Object.assign(new Error('network down'), { stderr: 'ERR_PNPM_FETCH_404' }) }
    ),
    /toolchain dependency install failed: ERR_PNPM_FETCH_404/
  )
})

test('write commands in non-interactive mode require --yes, while dry-run remains safe', () => {
  const proj = newProject('cli-confirmation')
  const rejected = run(['upgrade', '--project', proj])
  assert.equal(rejected.code, 1)
  assert.ok(rejected.err.includes('non-interactive'))
  assert.ok(!existsSync(join(proj, '.dsh-rules', 'state.json')))
  const preview = run(['upgrade', '--project', proj, '--dry-run'])
  assert.equal(preview.code, 0)
  assert.ok(!existsSync(join(proj, '.dsh-rules', 'state.json')))
})

test('invalid state previews but does not apply an upgrade', () => {
  const proj = newProject('cli-invalid-state')
  mkdirSync(join(proj, '.dsh-rules'), { recursive: true })
  writeFileSync(join(proj, '.dsh-rules', 'state.json'), '{not-json\n')
  const before = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  const result = run(['upgrade', '--project', proj, '--yes'])
  assert.equal(result.code, 1)
  assert.ok(result.err.includes('cannot parse state.json'))
  assert.equal(readFileSync(join(proj, 'AGENTS.md'), 'utf8'), before)
  assert.equal(readFileSync(join(proj, '.dsh-rules', 'state.json'), 'utf8'), '{not-json\n')
})

test('failed toolchain install leaves state uncommitted after files are updated', () => {
  const proj = newProject('cli-install-failure')
  const init = run(['init', '--project', proj, '--yes'])
  assert.equal(init.code, 0)
  const statePath = join(proj, '.dsh-rules', 'state.json')
  const before = readFileSync(statePath, 'utf8')
  const fakeBinDir = join(TMP, 'failing-pnpm-bin')
  mkdirSync(fakeBinDir, { recursive: true })
  const fakeBin = join(fakeBinDir, 'pnpm')
  writeFileSync(fakeBin, '#!/bin/sh\necho simulated install failure >&2\nexit 42\n')
  chmodSync(fakeBin, 0o755)
  const result = run(['upgrade', '--project', proj, '--feature', 'docGatesExtras=true', '--yes'], {
    env: { DSH_RULES_SKIP_TOOLCHAIN_INSTALL: '0', PATH: fakeBinDir + ':' + process.env.PATH }
  })
  assert.equal(result.code, 1)
  assert.ok(result.err.includes('toolchain dependency install failed'))
  assert.equal(readFileSync(statePath, 'utf8'), before)
  assert.ok(JSON.parse(readFileSync(join(proj, '.dsh-rules', 'toolchain', 'package.json'), 'utf8')).scripts['verify-mermaid'])
})

test('plugin apply() mounts with no side effects (R10)', () => {
  const script = "import('./dsh-rules.mjs').then((m) => m.apply({}))"
  const r = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', cwd: ROOT })
  assert.equal(r.status, 0)
  assert.ok(r.stdout.includes('mounted'))
  assert.ok(!r.stderr.includes('[dsh-rules] mounted, but pack unavailable'))
})

test('hash runs against a pack copy only and reaches 0 drift', () => {
  const packCopy = join(TMP, 'pack')
  cpSync(REAL_PACK, packCopy, { recursive: true })
  const h1 = run(['hash', '--pack', packCopy])
  assert.equal(h1.code, 0)
  const h2 = run(['hash', '--pack', packCopy])
  assert.equal(h2.code, 0)
  assert.match(h2.out, /hash refreshed: 0\/\d+/)
  // real pack manifest untouched
  const real = readFileSync(join(REAL_PACK, 'manifest.json'), 'utf8')
  assert.ok(real.includes('"feature-doc-budgets"'))
})

test('feature override flag reaches segments via CLI', () => {
  const proj = newProject('cli-feature')
  const on = run(['init', '--project', proj, '--feature', 'bilingualDocsDiscipline=true', '--yes'])
  assert.equal(on.code, 0)
  assert.ok(readFileSync(join(proj, 'AGENTS.md'), 'utf8').includes('feature-bilingual-docs'))
  const off = run(['init', '--project', proj, '--feature', 'textLinkManagement=false', '--feature', 'bilingualDocsDiscipline=false', '--yes'])
  assert.equal(off.code, 0)
  const root = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.ok(!root.includes('feature-bilingual-docs'))
  assert.ok(!root.includes('feature-text-link-management'))
})
