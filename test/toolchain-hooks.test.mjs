import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INSTALLER = join(ROOT, 'packages/toolchain/hooks/scripts/install-lefthook.mjs')
const fixtures = []

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true })
})

function command(commandName, args, cwd, env) {
  const result = spawnSync(commandName, args, { cwd, env, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`${commandName} ${args.join(' ')} failed: ${result.stderr}`)
  return result.stdout.trim()
}

function fixture() {
  const container = mkdtempSync(join(tmpdir(), 'vibe-init-hooks-'))
  fixtures.push(container)
  const main = join(container, 'main')
  const linked = join(container, 'linked')
  const env = {
    ...process.env,
    CI: 'false',
    GITHUB_ACTIONS: 'false',
    GIT_AUTHOR_EMAIL: 'hooks@example.test',
    GIT_AUTHOR_NAME: 'Hooks Test',
    GIT_COMMITTER_EMAIL: 'hooks@example.test',
    GIT_COMMITTER_NAME: 'Hooks Test',
    GIT_CONFIG_GLOBAL: join(container, 'global.gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    HOME: container,
    XDG_CONFIG_HOME: join(container, '.config'),
  }
  mkdirSync(main)
  command('git', ['init'], main, env)
  writeFileSync(join(main, 'README.md'), '# fixture\n')
  command('git', ['add', 'README.md'], main, env)
  command('git', ['commit', '-m', 'fixture'], main, env)
  command('git', ['worktree', 'add', '-b', 'linked', linked], main, env)
  return { container, env, linked, main }
}

function installToolchain(root, pairing = false) {
  const home = join(root, '.vibe-init/toolchain')
  mkdirSync(join(home, 'scripts'), { recursive: true })
  mkdirSync(join(home, 'node_modules/.bin'), { recursive: true })
  cpSync(INSTALLER, join(home, 'scripts/install-lefthook.mjs'))
  writeFileSync(join(home, 'package.json'), JSON.stringify({
    scripts: {
      'doc-sync': 'true',
      'verify-archived-agent-notes': 'true',
      ...(pairing ? { 'verify-translation-pairing': 'true' } : {}),
    },
  }))
  const fake = `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
if (process.argv.slice(2).join(' ') !== 'install --force') process.exit(64)
if (process.env.VIBE_INIT_TEST_LEFTHOOK_FAIL === '1') process.exit(77)
const delay = Number(process.env.VIBE_INIT_TEST_LEFTHOOK_DELAY_MS ?? 0)
if (delay > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay)
const hooks = execFileSync('git', ['config', '--get', 'core.hooksPath'], { encoding: 'utf8' }).trim()
mkdirSync(hooks, { recursive: true })
for (const name of ['pre-commit', 'pre-merge-commit', 'pre-push']) writeFileSync(hooks + '/' + name, '#!/bin/sh\\nexit 0\\n', { mode: 0o755 })
`
  writeFileSync(join(home, 'node_modules/.bin/lefthook'), fake)
  chmodSync(join(home, 'node_modules/.bin/lefthook'), 0o755)
}

function invoke(root, env, additions = {}) {
  return spawnSync(process.execPath, ['.vibe-init/toolchain/scripts/install-lefthook.mjs'], {
    cwd: root,
    env: { ...env, ...additions },
    encoding: 'utf8',
  })
}

function invokeAsync(root, env, additions = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, ['.vibe-init/toolchain/scripts/install-lefthook.mjs'], {
      cwd: root,
      env: { ...env, ...additions },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('close', status => resolvePromise({ status, stderr }))
  })
}

function gitPath(root, env, args) {
  return command('git', args, root, env)
}

test('installs isolated hook paths for main and linked worktrees and renders conditional jobs', () => {
  const f = fixture()
  installToolchain(f.main)
  installToolchain(f.linked, true)
  assert.equal(invoke(f.main, f.env).status, 0)
  assert.equal(invoke(f.linked, f.env).status, 0)

  const mainHooks = gitPath(f.main, f.env, ['config', '--worktree', '--get', 'core.hooksPath'])
  const linkedHooks = gitPath(f.linked, f.env, ['config', '--worktree', '--get', 'core.hooksPath'])
  assert.notEqual(mainHooks, linkedHooks)
  assert.equal(mainHooks, join(gitPath(f.main, f.env, ['rev-parse', '--absolute-git-dir']), 'vibe-init-hooks'))
  assert.equal(linkedHooks, join(gitPath(f.linked, f.env, ['rev-parse', '--absolute-git-dir']), 'vibe-init-hooks'))
  assert.ok(existsSync(join(mainHooks, '.vibe-init-lefthook-owned')))
  assert.ok(existsSync(join(linkedHooks, 'pre-push')))
  assert.doesNotMatch(readFileSync(join(f.main, 'lefthook.yml'), 'utf8'), /translation pairing/)
  assert.match(readFileSync(join(f.linked, 'lefthook.yml'), 'utf8'), /translation pairing \(staged records\)/)
  assert.match(readFileSync(join(f.main, 'lefthook.yml'), 'utf8'), /git diff --cached --check/)
  assert.match(readFileSync(join(f.main, 'lefthook.yml'), 'utf8'), /run doc-sync/)
})

test('refreshes an owned config and leaves a foreign config byte-identical', () => {
  const f = fixture()
  installToolchain(f.main)
  assert.equal(invoke(f.main, f.env).status, 0)
  installToolchain(f.main, true)
  assert.equal(invoke(f.main, f.env).status, 0)
  assert.match(readFileSync(join(f.main, 'lefthook.yml'), 'utf8'), /translation pairing/)

  installToolchain(f.linked)
  const foreign = 'pre-commit:\n  commands:\n    mine:\n      run: true\n'
  writeFileSync(join(f.linked, 'lefthook.yml'), foreign)
  const result = invoke(f.linked, f.env)
  assert.equal(result.status, 0)
  assert.match(result.stderr, /not overwriting/)
  assert.equal(readFileSync(join(f.linked, 'lefthook.yml'), 'utf8'), foreign)
  assert.equal(gitPath(f.linked, f.env, ['config', '--get', 'core.repositoryFormatVersion']), '1')
  assert.throws(() => gitPath(f.linked, f.env, ['config', '--worktree', '--get', 'core.hooksPath']))
})

test('protects inherited hook paths unless the current worktree explicitly opts in', () => {
  const f = fixture()
  installToolchain(f.main)
  gitPath(f.main, f.env, ['config', 'core.hooksPath', 'custom-hooks'])
  const refused = invoke(f.main, f.env)
  assert.equal(refused.status, 1)
  assert.match(refused.stderr, /refusing user-owned core\.hooksPath/)
  assert.equal(gitPath(f.main, f.env, ['config', '--get', 'core.hooksPath']), 'custom-hooks')

  const allowed = invoke(f.main, f.env, { VIBE_INIT_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE: '1' })
  assert.equal(allowed.status, 0, allowed.stderr)
  assert.match(gitPath(f.main, f.env, ['config', '--worktree', '--get', 'core.hooksPath']), /vibe-init-hooks$/)
  assert.equal(gitPath(f.linked, f.env, ['config', '--get', 'core.hooksPath']), 'custom-hooks')
})

test('rolls back a new managed config and hook path when Lefthook fails', () => {
  const f = fixture()
  installToolchain(f.main)
  const failed = invoke(f.main, f.env, { VIBE_INIT_TEST_LEFTHOOK_FAIL: '1' })
  assert.equal(failed.status, 1)
  assert.match(failed.stderr, /failed with status 77/)
  assert.equal(existsSync(join(f.main, 'lefthook.yml')), false)
  assert.throws(() => gitPath(f.main, f.env, ['config', '--worktree', '--get', 'core.hooksPath']))
  assert.equal(gitPath(f.main, f.env, ['config', '--get', 'extensions.worktreeConfig']), 'true')
})

test('refuses stale locks and unowned reserved hook directories', () => {
  const f = fixture()
  installToolchain(f.main)
  const common = resolve(f.main, gitPath(f.main, f.env, ['rev-parse', '--git-common-dir']))
  writeFileSync(join(common, 'vibe-init-lefthook-install.lock'), `999999 ${'0'.repeat(8)}-${'0'.repeat(4)}-${'0'.repeat(4)}-${'0'.repeat(4)}-${'0'.repeat(12)}\n`)
  const stale = invoke(f.main, f.env)
  assert.equal(stale.status, 1)
  assert.match(stale.stderr, /stale Lefthook installer lock/)
  rmSync(join(common, 'vibe-init-lefthook-install.lock'))

  const gitDirectory = gitPath(f.main, f.env, ['rev-parse', '--absolute-git-dir'])
  mkdirSync(join(gitDirectory, 'vibe-init-hooks'))
  const unowned = invoke(f.main, f.env)
  assert.equal(unowned.status, 1)
  assert.match(unowned.stderr, /unowned hooks directory/)
})

test('serializes concurrent installs and leaves a stable managed config', async () => {
  const f = fixture()
  installToolchain(f.main, true)
  const first = invokeAsync(f.main, f.env, { VIBE_INIT_TEST_LEFTHOOK_DELAY_MS: '250' })
  const second = invokeAsync(f.main, f.env)
  const results = await Promise.all([first, second])
  assert.deepEqual(results.map(result => result.status), [0, 0], results.map(result => result.stderr).join('\n'))
  const content = readFileSync(join(f.main, 'lefthook.yml'), 'utf8')
  assert.equal(content.match(/translation pairing \(staged records\)/g)?.length, 2)
  const common = resolve(f.main, gitPath(f.main, f.env, ['rev-parse', '--git-common-dir']))
  assert.equal(existsSync(join(common, 'vibe-init-lefthook-install.lock')), false)
})

test('relocates an owned hook path copied into a later linked worktree', () => {
  const f = fixture()
  installToolchain(f.main)
  assert.equal(invoke(f.main, f.env).status, 0)
  const late = join(f.container, 'late')
  command('git', ['worktree', 'add', '-b', 'late', late], f.main, f.env)
  installToolchain(late)
  const copied = gitPath(late, f.env, ['config', '--worktree', '--get', 'core.hooksPath'])
  assert.match(copied, /vibe-init-hooks$/)
  assert.equal(invoke(late, f.env).status, 0)
  const relocated = gitPath(late, f.env, ['config', '--worktree', '--get', 'core.hooksPath'])
  assert.notEqual(relocated, copied)
  assert.equal(relocated, join(gitPath(late, f.env, ['rev-parse', '--absolute-git-dir']), 'vibe-init-hooks'))
})
