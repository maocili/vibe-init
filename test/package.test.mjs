// dsh-rules package distribution tests: pack, install, and consume the real tarball.
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
  const packed = run('npm', ['pack', '--json', '--pack-destination', destination])
  assert.equal(packed.code, 0, packed.err)
  const metadata = JSON.parse(packed.out)[0]
  tarball = join(destination, basename(metadata.filename))
  tarballFiles = new Set(metadata.files.map((file) => file.path))

  consumer = join(TMP, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'dsh-rules-consumer', private: true }, null, 2) + '\n')
  const installed = run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: consumer })
  assert.equal(installed.code, 0, installed.err)
})

after(() => {
  rmSync(TMP, { recursive: true, force: true })
})

test('tarball contains the public runtime, bundle patch, and complete rules pack only', () => {
  assert.equal(tarballFiles.has('package.json'), true)
  assert.equal(tarballFiles.has('dsh-rules.mjs'), true)
  assert.equal(tarballFiles.has('bin/dsh-rules.mjs'), true)
  assert.equal(tarballFiles.has('cordis.patch.yml'), true)
  assert.equal(tarballFiles.has('rules-pack/manifest.json'), true)
  assert.equal(tarballFiles.has('rules-pack/toolchain/spec.json'), true)
  assert.equal(tarballFiles.has('rules-pack/skills-optional/code-review/SKILL.md'), true)
  assert.equal([...tarballFiles].some((path) => path.startsWith('test/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('docs/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('.agents/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('.dsh-rules/')), false)
  assert.equal([...tarballFiles].some((path) => path.startsWith('node_modules/')), false)

  const manifest = JSON.parse(readFileSync(join(consumer, 'node_modules', '@xuxf', 'dsh-rules', 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@xuxf/dsh-rules')
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(readFileSync(join(consumer, 'node_modules', '@xuxf', 'dsh-rules', 'cordis.patch.yml'), 'utf8'), "# Activate dsh-rules as a profile plugin when this package is installed.\n- insert:\n    - id: dsh-rules\n      name: '@xuxf/dsh-rules'\n")
})

test('installed Cordis entry and CLI use the package-local rules pack', () => {
  const packageDir = join(consumer, 'node_modules', '@xuxf', 'dsh-rules')
  const mounted = run(process.execPath, ['--input-type=module', '-e', "const plugin = await import('@xuxf/dsh-rules'); await plugin.apply()"], { cwd: consumer })
  assert.equal(mounted.code, 0, mounted.err)
  assert.match(mounted.out, /\[dsh-rules\] mounted .*pack 0\.1\.0-draft/)

  const project = join(TMP, 'project')
  mkdirSync(join(project, '.git'), { recursive: true })
  writeFileSync(join(project, 'AGENTS.md'), '## Package consumer\n')
  const env = { DSH_RULES_SKIP_TOOLCHAIN_INSTALL: '1' }
  const first = run(join(packageDir, 'bin', 'dsh-rules.mjs'), ['init', '--project', project, '--yes'], { cwd: consumer, env })
  assert.equal(first.code, 0, first.err)
  assert.match(first.out, /applied/)
  assert.equal(existsSync(join(project, '.agents', 'notes', 'README.md')), true)
  assert.equal(existsSync(join(project, '.agents', 'skills', 'code-review', 'SKILL.md')), true)
  assert.equal(existsSync(join(project, '.dsh-rules', 'toolchain', 'package.json')), true)

  const second = run(join(packageDir, 'bin', 'dsh-rules.mjs'), ['init', '--project', project, '--yes'], { cwd: consumer, env })
  assert.equal(second.code, 0, second.err)
  assert.match(second.out, /nothing to do/)

  const status = run(join(packageDir, 'bin', 'dsh-rules.mjs'), ['status', '--project', project, '--json'], { cwd: consumer, env })
  assert.equal(status.code, 0, status.err)
  const statusJson = JSON.parse(status.out)
  assert.equal(statusJson.project.root, project)
  assert.equal(statusJson.state.present, true)
})
