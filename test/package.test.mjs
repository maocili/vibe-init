// vibe-init package distribution tests: pack, install, and consume the real tarball.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let TMP
let tarballFiles
let consumer
let globalBin
let globalEnv

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    ...options,
    env: {
      ...process.env,
      npm_config_cache: join(TMP, 'npm-cache'),
      ...(options.env || {})
    }
  })
  return { code: result.status, out: result.stdout || '', err: result.stderr || '' }
}

before(() => {
  TMP = mkdtempSync(join(ROOT, '.package-test-'))
  const destination = join(TMP, 'tarball')
  mkdirSync(destination)
  const packed = run('pnpm', ['pack', '--json', '--pack-destination', destination])
  assert.equal(packed.code, 0, packed.err)
  const metadata = JSON.parse(packed.out)
  const tarball = join(destination, basename(metadata.filename))
  tarballFiles = new Set(metadata.files.map((file) => file.path))

  consumer = join(TMP, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'vibe-init-consumer', private: true }, null, 2) + '\n')
  const installed = run('pnpm', ['install', '--ignore-scripts', tarball], { cwd: consumer })
  assert.equal(installed.code, 0, installed.err)

  const pnpmHome = join(TMP, 'pnpm-home')
  const globalDir = join(TMP, 'global')
  globalEnv = {
    PNPM_HOME: pnpmHome,
    PATH: join(pnpmHome, 'bin') + ':' + process.env.PATH
  }
  const globallyInstalled = run('pnpm', ['install', '--global', '--global-dir', globalDir, '--ignore-scripts', tarball], { cwd: consumer, env: globalEnv })
  assert.equal(globallyInstalled.code, 0, globallyInstalled.err)
  globalBin = join(pnpmHome, 'bin', 'vibe-init')
  assert.equal(existsSync(globalBin), true)

  const help = run(globalBin, ['help'], { cwd: consumer, env: globalEnv })
  assert.equal(help.code, 0, help.err)
  assert.match(help.out, /^vibe-init <command>/)
  assert.equal(existsSync(join(consumer, 'AGENTS.md')), false)
  assert.equal(existsSync(join(consumer, '.agents')), false)
  assert.equal(existsSync(join(consumer, '.dsh-vibe')), false)
})

after(() => {
  rmSync(TMP, { recursive: true, force: true })
})

test('tarball contains only the standalone CLI runtime and complete rules pack', () => {
  assert.equal(tarballFiles.has('package.json'), true)
  assert.equal(tarballFiles.has('bin/vibe-init.mjs'), true)
  assert.equal(tarballFiles.has('lib/cli.mjs'), true)
  assert.equal(tarballFiles.has('packages/manifest.json'), true)
  assert.equal(tarballFiles.has('packages/toolchain/spec.json'), true)
  assert.equal(tarballFiles.has('packages/skills/code-review/SKILL.md'), true)

  for (const excluded of ['dsh-vibe.mjs', 'cordis.patch.yml', 'cordis.patch.sample.yml', 'bin/dsh-vibe.mjs']) {
    assert.equal(tarballFiles.has(excluded), false, excluded)
  }
  for (const prefix of ['test/', 'docs/', '.agents/', '.dsh-vibe/', 'node_modules/']) {
    assert.equal([...tarballFiles].some((path) => path.startsWith(prefix)), false, prefix)
  }
})

test('installed manifest exposes one binary and no module or host-plugin surface', () => {
  const manifest = JSON.parse(readFileSync(join(consumer, 'node_modules', '@maocili', 'vibe-init', 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@maocili/vibe-init')
  assert.equal(manifest.version, '0.3.0')
  assert.deepEqual(manifest.files, ['bin/', 'lib/', 'packages/'])
  assert.deepEqual(manifest.bin, { 'vibe-init': './bin/vibe-init.mjs' })
  assert.equal(manifest.exports, undefined)
  assert.equal(manifest.dsh, undefined)
  assert.equal(manifest.main, undefined)
  for (const script of ['preinstall', 'install', 'postinstall', 'prepare', 'prepack', 'postpack', 'prepublish', 'prepublishOnly', 'postpublish']) {
    assert.equal(manifest.scripts?.[script], undefined, script)
  }
})

test('globally installed CLI initializes idempotently and reports status and audit', () => {
  const project = join(TMP, 'project')
  mkdirSync(join(project, '.git'), { recursive: true })
  writeFileSync(join(project, 'AGENTS.md'), '## Package consumer\n')
  const env = { ...globalEnv, DSH_VIBE_SKIP_TOOLCHAIN_INSTALL: '1' }

  const first = run(globalBin, ['init', '--project', project, '--yes'], { cwd: consumer, env })
  assert.equal(first.code, 0, first.err)
  assert.match(first.out, /\[vibe-init\].*applied/)
  assert.equal(existsSync(join(project, '.agents', 'notes', 'README.md')), true)
  assert.equal(existsSync(join(project, '.agents', 'skills', 'code-review', 'SKILL.md')), true)
  assert.equal(existsSync(join(project, '.dsh-vibe', 'toolchain', 'package.json')), true)
  assert.equal(existsSync(join(project, '.dsh-vibe', 'state.json')), true)

  const second = run(globalBin, ['init', '--project', project, '--yes'], { cwd: consumer, env })
  assert.equal(second.code, 0, second.err)
  assert.match(second.out, /nothing to do/)

  const status = run(globalBin, ['status', '--project', project, '--json'], { cwd: consumer, env })
  assert.equal(status.code, 0, status.err)
  const statusJson = JSON.parse(status.out)
  assert.equal(statusJson.project.root, project)
  assert.equal(statusJson.state.present, true)

  const audit = run(globalBin, ['audit', '--project', project, '--json'], { cwd: consumer, env })
  assert.equal(audit.code, 0, audit.err)
  const auditJson = JSON.parse(audit.out)
  assert.equal(auditJson.project.root, project)
  assert.deepEqual(auditJson.notes.filter((note) => note.level === 'warn' || note.level === 'flag'), [])
})
