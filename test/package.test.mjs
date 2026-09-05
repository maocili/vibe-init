// dsh-vibe package distribution tests: pack, install, and consume the real tarball.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let TMP
let tarball
let tarballFiles
let consumer
let globalBin

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
  tarball = join(destination, basename(metadata.filename))
  tarballFiles = new Set(metadata.files.map((file) => file.path))

  consumer = join(TMP, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'dsh-vibe-consumer', private: true }, null, 2) + '\n')
  const installed = run('pnpm', ['install', '--ignore-scripts', tarball], { cwd: consumer })
  assert.equal(installed.code, 0, installed.err)

  const pnpmHome = join(TMP, 'pnpm-home')
  const globalDir = join(TMP, 'global')
  const globalEnv = {
    PNPM_HOME: pnpmHome,
    PATH: join(pnpmHome, 'bin') + ':' + process.env.PATH
  }
  const globallyInstalled = run('pnpm', ['install', '--global', '--global-dir', globalDir, tarball], { cwd: consumer, env: globalEnv })
  assert.equal(globallyInstalled.code, 0, globallyInstalled.err)
  globalBin = join(pnpmHome, 'bin', 'dsh-vibe')
  assert.equal(existsSync(globalBin), true)
  const help = run(globalBin, ['help'], { cwd: consumer, env: globalEnv })
  assert.equal(help.code, 0, help.err)
  assert.match(help.out, /^dsh-vibe <command>/)
  assert.equal(existsSync(join(consumer, 'AGENTS.md')), false)
  assert.equal(existsSync(join(consumer, '.agents')), false)
  assert.equal(existsSync(join(consumer, '.dsh-vibe')), false)
})

after(() => {
  rmSync(TMP, { recursive: true, force: true })
})

test('tarball contains the public runtime, bundle patch, and complete rules pack only', () => {
  assert.equal(tarballFiles.has('package.json'), true)
  assert.equal(tarballFiles.has('dsh-vibe.mjs'), true)
  assert.equal(tarballFiles.has('bin/dsh-vibe.mjs'), true)
  assert.equal(tarballFiles.has('cordis.patch.yml'), true)
  assert.equal(tarballFiles.has('packages/manifest.json'), true)
  assert.equal(tarballFiles.has('packages/toolchain/spec.json'), true)
  assert.equal(tarballFiles.has('packages/skills/code-review/SKILL.md'), true)
  assert.equal([...tarballFiles].some((path) => path.startsWith('test/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('docs/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('.agents/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('.dsh-vibe/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('node_modules/')), false)

  const manifest = JSON.parse(readFileSync(join(consumer, 'node_modules', '@maocili', 'dsh-vibe', 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@maocili/dsh-vibe')
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(readFileSync(join(consumer, 'node_modules', '@maocili', 'dsh-vibe', 'cordis.patch.yml'), 'utf8'), "# Activate dsh-vibe as a profile plugin when this package is installed.\n- insert:\n    - id: dsh-vibe\n      name: '@maocili/dsh-vibe'\n")
})

test('installed Cordis entry and CLI use the package-local rules pack', () => {
  const packageDir = join(consumer, 'node_modules', '@maocili', 'dsh-vibe')
  const mounted = run(process.execPath, ['--input-type=module', '-e', "const plugin = await import('@maocili/dsh-vibe'); await plugin.apply()"], { cwd: consumer })
  assert.equal(mounted.code, 0, mounted.err)
  assert.match(mounted.out, /\[dsh-vibe\] mounted .*pack 0\.2\.0/)

  const project = join(TMP, 'project')
  mkdirSync(join(project, '.git'), { recursive: true })
  writeFileSync(join(project, 'AGENTS.md'), '## Package consumer\n')
  const env = { DSH_VIBE_SKIP_TOOLCHAIN_INSTALL: '1' }
  const first = run(globalBin, ['init', '--project', project, '--yes'], { cwd: consumer, env })
  assert.equal(first.code, 0, first.err)
  assert.match(first.out, /applied/)
  assert.equal(existsSync(join(project, '.agents', 'notes', 'README.md')), true)
  assert.equal(existsSync(join(project, '.agents', 'skills', 'code-review', 'SKILL.md')), true)
  assert.equal(existsSync(join(project, '.dsh-vibe', 'toolchain', 'package.json')), true)

  const second = run(globalBin, ['init', '--project', project, '--yes'], { cwd: consumer, env })
  assert.equal(second.code, 0, second.err)
  assert.match(second.out, /nothing to do/)

  const status = run(globalBin, ['status', '--project', project, '--json'], { cwd: consumer, env })
  assert.equal(status.code, 0, status.err)
  const statusJson = JSON.parse(status.out)
  assert.equal(statusJson.project.root, project)
  assert.equal(statusJson.state.present, true)
})
