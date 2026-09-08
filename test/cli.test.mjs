// vibe-init CLI integration tests (node:test): spawn the real bin.
// Uses a temp project fixture and a temp copy of the pack (real packages is never mutated;
// hash runs only against the temp copy).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, chmodSync, lstatSync, readdirSync, readlinkSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installToolchainIfNeeded } from '../lib/cli.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BIN = join(ROOT, 'bin', 'vibe-init.mjs')
const REAL_PACK = join(ROOT, 'packages')
let TMP

function run(args, opts = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8', ...opts,
    env: { ...process.env, VIBE_INIT_SKIP_TOOLCHAIN_INSTALL: '1', ...(opts.env || {}) }
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

function snapshotTree(root, prefix = '') {
  const rows = []
  for (const name of readdirSync(root).sort()) {
    const abs = join(root, name)
    const rel = prefix ? prefix + '/' + name : name
    const st = lstatSync(abs)
    if (st.isSymbolicLink()) rows.push(rel + ' -> ' + readlinkSync(abs))
    else if (st.isDirectory()) rows.push(rel + '/', ...snapshotTree(abs, rel))
    else rows.push(rel + ': ' + readFileSync(abs, 'utf8'))
  }
  return rows
}

test('help lists project-only command surface; unknown command exits 2', () => {
  const h = run(['help'])
  assert.equal(h.code, 0)
  assert.ok(h.out.includes('REQUIREMENTS v1.0'))
  assert.ok(!h.out.includes('install-global'))
  const u = run(['bogus-command'])
  assert.equal(u.code, 2)
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
  const state = JSON.parse(readFileSync(join(proj, '.vibe-init', 'state.json'), 'utf8'))
  assert.equal(state.schemaVersion, 2)
  assert.equal(state.owner, 'vibe-init')
  assert.equal(state.packVersion, '0.4.2')
  const st = run(['status', '--project', proj, '--json'])
  assert.equal(st.code, 0)
  const json = JSON.parse(st.out)
  assert.ok('project' in json && !('global' in json))
  const aud = run(['audit', '--project', proj, '--json'])
  assert.equal(aud.code, 0)
  const audJson = JSON.parse(aud.out)
  assert.deepEqual(audJson.notes.filter((n) => n.what === 'pack-drift'), [])
  const staleState = JSON.parse(readFileSync(join(proj, '.vibe-init', 'state.json'), 'utf8'))
  staleState.packVersion = 'old-pack'
  writeFileSync(join(proj, '.vibe-init', 'state.json'), JSON.stringify(staleState, null, 2) + '\n')
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

test('old pack environment override is ignored', () => {
  const listed = run(['list-skills'], { env: { DSH_VIBE_PACK: join(TMP, 'missing-old-pack') } })
  assert.equal(listed.code, 0)
  assert.ok(listed.out.includes('archive-agent-notes'))
})

test('upgrade installs toolchain dependencies when package composition changes', async () => {
  const project = newProject('install-helper')
  const toolchainHome = join(project, '.vibe-init', 'toolchain')
  mkdirSync(toolchainHome, { recursive: true })
  let call = null
  await installToolchainIfNeeded(
    { requiresInstall: true, toolchainHome },
    project,
    async (...args) => { call = args; return { stdout: '', stderr: '' } }
  )
  assert.deepEqual(call.slice(0, 2), ['pnpm', ['-C', toolchainHome, 'install']])
  assert.equal(call[2].cwd, project)
})

test('toolchain dependency install tolerates package-manager store symlinks in node_modules', async () => {
  const project = newProject('install-node-modules')
  const toolchainHome = join(project, '.vibe-init', 'toolchain')
  const store = join(project, 'external-pnpm-store')
  mkdirSync(join(toolchainHome, 'node_modules', '.bin'), { recursive: true })
  mkdirSync(store, { recursive: true })
  // pnpm lays out node_modules/.pnpm with symlinks into a store outside the toolchain;
  // install must not walk that tree for containment.
  symlinkSync(store, join(toolchainHome, 'node_modules', '.pnpm'), 'dir')
  writeFileSync(join(toolchainHome, 'package.json'), '{}\n')
  let call = null
  await installToolchainIfNeeded(
    { requiresInstall: true, toolchainHome },
    project,
    async (...args) => { call = args; return { stdout: '', stderr: '' } }
  )
  assert.deepEqual(call.slice(0, 2), ['pnpm', ['-C', toolchainHome, 'install']])
})

test('old toolchain-install environment override is ignored', async () => {
  const project = newProject('old-install-override')
  const toolchainHome = join(project, '.vibe-init', 'toolchain')
  mkdirSync(toolchainHome, { recursive: true })
  const previousNew = process.env.VIBE_INIT_SKIP_TOOLCHAIN_INSTALL
  const previousOld = process.env.DSH_VIBE_SKIP_TOOLCHAIN_INSTALL
  delete process.env.VIBE_INIT_SKIP_TOOLCHAIN_INSTALL
  process.env.DSH_VIBE_SKIP_TOOLCHAIN_INSTALL = '1'
  let called = false
  try {
    await installToolchainIfNeeded(
      { requiresInstall: true, toolchainHome },
      project,
      async () => { called = true; return { stdout: '', stderr: '' } }
    )
  } finally {
    if (previousNew === undefined) delete process.env.VIBE_INIT_SKIP_TOOLCHAIN_INSTALL
    else process.env.VIBE_INIT_SKIP_TOOLCHAIN_INSTALL = previousNew
    if (previousOld === undefined) delete process.env.DSH_VIBE_SKIP_TOOLCHAIN_INSTALL
    else process.env.DSH_VIBE_SKIP_TOOLCHAIN_INSTALL = previousOld
  }
  assert.equal(called, true)
})

test('toolchain dependency failure is surfaced for a retry', async () => {
  const project = newProject('install-failure-helper')
  const toolchainHome = join(project, '.vibe-init', 'toolchain')
  mkdirSync(toolchainHome, { recursive: true })
  await assert.rejects(
    installToolchainIfNeeded(
      { requiresInstall: true, toolchainHome },
      project,
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
  assert.ok(!existsSync(join(proj, '.vibe-init', 'state.json')))
  const preview = run(['upgrade', '--project', proj, '--dry-run'])
  assert.equal(preview.code, 0)
  assert.ok(!existsSync(join(proj, '.vibe-init', 'state.json')))
})

test('invalid state previews but does not apply an upgrade', () => {
  const proj = newProject('cli-invalid-state')
  mkdirSync(join(proj, '.vibe-init'), { recursive: true })
  writeFileSync(join(proj, '.vibe-init', 'state.json'), '{not-json\n')
  const before = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  const result = run(['upgrade', '--project', proj, '--yes'])
  assert.equal(result.code, 1)
  assert.ok(result.err.includes('cannot parse state.json'))
  assert.equal(readFileSync(join(proj, 'AGENTS.md'), 'utf8'), before)
  assert.equal(readFileSync(join(proj, '.vibe-init', 'state.json'), 'utf8'), '{not-json\n')
})

test('schema 1 in the new state path blocks upgrade without writes', () => {
  const proj = newProject('cli-schema1-state')
  const statePath = join(proj, '.vibe-init', 'state.json')
  mkdirSync(dirname(statePath), { recursive: true })
  const schema1 = JSON.stringify({ schemaVersion: 1, files: [], segments: [] }, null, 2) + '\n'
  writeFileSync(statePath, schema1)
  const before = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  const result = run(['upgrade', '--project', proj, '--yes'])
  assert.equal(result.code, 1)
  assert.ok(result.err.includes('unsupported state schema 1'))
  assert.equal(readFileSync(join(proj, 'AGENTS.md'), 'utf8'), before)
  assert.equal(readFileSync(statePath, 'utf8'), schema1)
})

test('failed toolchain install leaves state uncommitted and a retry still installs', () => {
  const proj = newProject('cli-install-failure')
  const init = run(['init', '--project', proj, '--yes'])
  assert.equal(init.code, 0)
  const statePath = join(proj, '.vibe-init', 'state.json')
  const before = readFileSync(statePath, 'utf8')
  const pkgPath = join(proj, '.vibe-init', 'toolchain', 'package.json')
  const pkgBefore = readFileSync(pkgPath, 'utf8')
  const callsPath = join(TMP, 'pnpm-calls-' + proj.split('-').pop())
  const fakeBinDir = join(TMP, 'counting-pnpm-bin')
  mkdirSync(fakeBinDir, { recursive: true })
  const fakeBin = join(fakeBinDir, 'pnpm')
  writeFileSync(fakeBin, '#!/bin/sh\ncount=$(cat ' + callsPath + ' 2>/dev/null || echo 0)\necho $((count + 1)) > ' + callsPath + '\necho simulated install failure >&2\nexit 42\n')
  chmodSync(fakeBin, 0o755)
  const env = { VIBE_INIT_SKIP_TOOLCHAIN_INSTALL: '0', PATH: fakeBinDir + ':' + process.env.PATH }

  const result = run(['upgrade', '--project', proj, '--feature', 'docGatesExtras=true', '--yes'], { env })
  assert.equal(result.code, 1)
  assert.ok(result.err.includes('toolchain dependency install failed'))
  assert.equal(readFileSync(statePath, 'utf8'), before)
  // rollback: the composed package.json returns to its pre-upgrade bytes so the next
  // identical upgrade still detects the change and retries the install
  assert.equal(readFileSync(pkgPath, 'utf8'), pkgBefore)

  const retry = run(['upgrade', '--project', proj, '--feature', 'docGatesExtras=true', '--yes'], { env })
  assert.equal(retry.code, 1)
  assert.equal(readFileSync(statePath, 'utf8'), before)
  assert.equal(readFileSync(pkgPath, 'utf8'), pkgBefore)
  const calls = readFileSync(callsPath, 'utf8').trim()
  assert.equal(calls, '2', 'the retried upgrade must invoke pnpm again')
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

test('CLI rejects project .agents and .vibe-init symlink escapes before mutation', () => {
  for (const name of ['.agents', '.vibe-init']) {
    const proj = newProject('project-symlink-' + name.slice(1))
    const outside = join(TMP, 'outside-project-' + name.slice(1))
    mkdirSync(join(outside, 'nested'), { recursive: true })
    writeFileSync(join(outside, 'sentinel.txt'), 'outside sentinel\n')
    writeFileSync(join(outside, 'nested', 'keep.txt'), 'nested sentinel\n')
    symlinkSync(outside, join(proj, name))
    const before = snapshotTree(outside)
    const rootBefore = readFileSync(join(proj, 'AGENTS.md'), 'utf8')

    const result = run(['init', '--project', proj, '--yes'])

    assert.equal(result.code, 1, name)
    assert.match(result.err, /project target confinement failed/, name)
    assert.deepEqual(snapshotTree(outside), before, name)
    assert.equal(readFileSync(join(proj, 'AGENTS.md'), 'utf8'), rootBefore, name)
  }
})

test('unsafe copied packs block init without touching project or outside sentinels', () => {
  const cases = [
    ['target-parent', (manifest) => { manifest.files[0].target = '../../escape.txt' }],
    ['target-absolute', (manifest) => { manifest.files[0].target = '/tmp/escape.txt' }],
    ['source-parent', (manifest) => { manifest.files[0].source = '../outside-secret.txt' }],
    ['spec-parent', (manifest) => { manifest.toolchain.spec = '../outside-spec.json' }]
  ]
  for (const [name, mutate] of cases) {
    const proj = newProject('unsafe-' + name)
    const packCopy = join(TMP, 'pack-' + name)
    cpSync(REAL_PACK, packCopy, { recursive: true })
    const manifestPath = join(packCopy, 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    mutate(manifest)
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    const outside = join(TMP, 'escape.txt')
    writeFileSync(outside, 'sentinel-secret\n')
    const before = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
    const result = run(['init', '--project', proj, '--pack', packCopy, '--yes'])
    assert.equal(result.code, 1, name)
    assert.equal(readFileSync(join(proj, 'AGENTS.md'), 'utf8'), before, name)
    assert.equal(existsSync(join(proj, '.vibe-init')), false, name)
    assert.equal(readFileSync(outside, 'utf8'), 'sentinel-secret\n', name)
  }
})

test('CLI blocks unsafe toolchain group sources and escaping manifest source symlinks', () => {
  const cases = [
    ['group-parent', (packCopy) => {
      const specPath = join(packCopy, 'toolchain', 'spec.json')
      const spec = JSON.parse(readFileSync(specPath, 'utf8'))
      spec.groups[0].src = '../../outside-toolchain'
      writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n')
    }],
    ['row-source-symlink', (packCopy, outside) => {
      const source = join(packCopy, 'standing-orders-block.md')
      rmSync(source)
      symlinkSync(join(outside, 'sentinel.txt'), source)
    }]
  ]
  for (const [name, mutate] of cases) {
    const proj = newProject('unsafe-real-pack-' + name)
    const packCopy = join(TMP, 'unsafe-real-pack-copy-' + name)
    const outside = join(TMP, 'unsafe-real-pack-outside-' + name)
    cpSync(REAL_PACK, packCopy, { recursive: true })
    mkdirSync(outside, { recursive: true })
    writeFileSync(join(outside, 'sentinel.txt'), 'outside pack sentinel\n')
    mutate(packCopy, outside)
    const before = snapshotTree(outside)
    const result = run(['init', '--project', proj, '--pack', packCopy, '--yes'])
    assert.equal(result.code, 1, name)
    assert.match(result.err, /pack problem/, name)
    assert.match(result.err, /blocked: rule pack integrity validation failed/, name)
    assert.deepEqual(snapshotTree(outside), before, name)
    assert.equal(existsSync(join(proj, '.vibe-init')), false, name)
  }
})

test('row hash drift blocks init and hash repairs a safe source', () => {
  const proj = newProject('row-hash-drift')
  const packCopy = join(TMP, 'pack-row-hash-drift')
  cpSync(REAL_PACK, packCopy, { recursive: true })
  const source = join(packCopy, 'standing-orders-block.md')
  writeFileSync(source, readFileSync(source, 'utf8') + '\nsafe drift\n')

  const blocked = run(['init', '--project', proj, '--pack', packCopy, '--yes'])
  assert.equal(blocked.code, 1)
  assert.match(blocked.err, /sha256 drift/)
  assert.equal(existsSync(join(proj, '.vibe-init')), false)

  const repaired = run(['hash', '--pack', packCopy])
  assert.equal(repaired.code, 0)
  assert.match(repaired.out, /hash refreshed: [1-9]/)
  const zeroDrift = run(['hash', '--pack', packCopy])
  assert.equal(zeroDrift.code, 0)
  assert.match(zeroDrift.out, /hash refreshed: 0\/\d+/)
  const initialized = run(['init', '--project', proj, '--pack', packCopy, '--yes'])
  assert.equal(initialized.code, 0)
})

test('valid nested manifest target is materialized under the project root', () => {
  const proj = newProject('nested-target')
  const packCopy = join(TMP, 'pack-nested-target')
  cpSync(REAL_PACK, packCopy, { recursive: true })
  const manifestPath = join(packCopy, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.files[0].target = 'nested/AGENTS.md'
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  const result = run(['init', '--project', proj, '--pack', packCopy, '--yes'])
  assert.equal(result.code, 0)
  assert.equal(existsSync(join(proj, 'nested', 'AGENTS.md')), true)
})

test('toolchain target mismatch is a pack problem that blocks upgrade', () => {
  const proj = newProject('cli-pack-target-mismatch')
  const packCopy = join(TMP, 'pack-target-mismatch')
  cpSync(REAL_PACK, packCopy, { recursive: true })
  const specPath = join(packCopy, 'toolchain', 'spec.json')
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  spec.target = '.vibe-init/other-toolchain'
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n')
  const before = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  const result = run(['upgrade', '--project', proj, '--pack', packCopy, '--yes'])
  assert.equal(result.code, 1)
  assert.ok(result.err.includes('pack problem: toolchain: manifest target must exactly match spec.target'))
  assert.ok(result.err.includes('upgrade blocked'))
  assert.equal(readFileSync(join(proj, 'AGENTS.md'), 'utf8'), before)
  assert.equal(existsSync(join(proj, '.vibe-init')), false)
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
