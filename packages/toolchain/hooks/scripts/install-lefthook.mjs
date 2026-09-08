#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  closeSync, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync,
  readdirSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOME = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG_MARKER = '# vibe-init managed (install-lefthook.mjs)'
const HOOKS_DIRECTORY = 'vibe-init-hooks'
const OWNERSHIP_MARKER = '.vibe-init-lefthook-owned'
const OWNER = 'vibe-init worktree-local lefthook hooks'
const LOCK_NAME = 'vibe-init-lefthook-install.lock'
const LOCK_TIMEOUT_MS = 30_000
const LOCK_INITIALIZATION_TIMEOUT_MS = 5_000
const LOCK_POLL_MS = 50
const ALLOW_OVERRIDE = 'VIBE_INIT_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE'

function errorCode(error) {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', env: options.env ?? process.env, ...options })
  if (result.status !== 0 && !options.allowStatuses?.includes(result.status)) {
    const detail = result.error?.message ?? result.stderr?.trim() ?? `exit status ${String(result.status)}`
    throw new Error(`${command} ${args.join(' ')} failed: ${detail}`)
  }
  return result
}

const git = (root, args, options = {}) => run('git', args, { cwd: root, ...options })
const trimGit = output => output.replace(/\r?\n$/, '')

function nul(result) {
  if (result.status !== 0) return []
  if (result.stdout === '') return []
  return result.stdout.replace(/\0$/, '').split('\0')
}

function directValues(root, path, key) {
  return nul(git(root, ['config', '--file', path, '--no-includes', '--null', '--get-all', key], { allowStatuses: [1] }))
}

function includedEntries(root, path, key) {
  const fields = nul(git(root, ['config', '--file', path, '--includes', '--null', '--show-origin', '--get-all', key], { allowStatuses: [1] }))
  if (fields.length % 2 !== 0) throw new Error(`git config returned invalid entries for ${key}`)
  const entries = []
  for (let index = 0; index < fields.length; index += 2) entries.push({ origin: fields[index], value: fields[index + 1] })
  return entries
}

function effectiveEntry(root, key) {
  const fields = nul(git(root, ['config', '--null', '--show-scope', '--show-origin', '--get', key], { allowStatuses: [1] }))
  if (fields.length === 0) return undefined
  if (fields.length !== 3) throw new Error(`git config returned an invalid scoped value for ${key}`)
  return { scope: fields[0], origin: fields[1], value: fields[2] }
}

function one(values, key) {
  if (values.length > 1) throw new Error(`multiple ${key} values are not supported`)
  return values[0]
}

function stat(path) {
  try { return lstatSync(path) } catch (error) { if (errorCode(error) === 'ENOENT') return undefined; throw error }
}

function samePath(left, right) {
  const a = resolve(left); const b = resolve(right)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

function originIs(origin, root, path) {
  if (!origin.startsWith('file:')) return false
  const value = origin.slice(5)
  return samePath(isAbsolute(value) ? value : resolve(root, value), path)
}

function parseBoolean(value, key) {
  if (['', 'true', 'yes', 'on', '1'].includes(value.toLowerCase())) return true
  if (['false', 'no', 'off', '0'].includes(value.toLowerCase())) return false
  throw new Error(`invalid Boolean value for ${key}: ${JSON.stringify(value)}`)
}

function assertGitVersion(root) {
  const version = git(root, ['--version']).stdout.trim()
  const match = /git version (\d+)\.(\d+)(?:\.(\d+))?/.exec(version)
  if (match === null) throw new Error(`cannot determine Git version from ${JSON.stringify(version)}`)
  const actual = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)]
  if (actual[0] < 2 || actual[0] === 2 && actual[1] < 26) {
    throw new Error(`Git 2.26 or newer is required for worktree-local hooks; found ${version}`)
  }
}

function worktreeConfigs(common) {
  const paths = [join(common, 'config.worktree')]
  try {
    for (const entry of readdirSync(join(common, 'worktrees'), { withFileTypes: true })) {
      if (entry.isDirectory()) paths.push(join(common, 'worktrees', entry.name, 'config.worktree'))
    }
  } catch (error) { if (errorCode(error) !== 'ENOENT') throw error }
  return paths.sort()
}

function extensionEnabled(root, commonConfig) {
  const value = one(directValues(root, commonConfig, 'extensions.worktreeConfig'), 'extensions.worktreeConfig')
  return value === undefined ? false : parseBoolean(value, 'extensions.worktreeConfig')
}

function inspectWorktreeConfigs(root, common, commonConfig) {
  const enabled = extensionEnabled(root, commonConfig)
  for (const path of worktreeConfigs(common)) {
    const entry = stat(path)
    if (entry === undefined) continue
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`refusing non-regular worktree config ${JSON.stringify(path)}`)
    const populated = git(root, ['config', '--file', path, '--no-includes', '--null', '--list']).stdout !== ''
    if (!enabled && populated) throw new Error(`cannot enable extensions.worktreeConfig while dormant worktree config ${JSON.stringify(path)} contains settings`)
  }
}

function planMigration(root, commonConfig) {
  const versionText = one(directValues(root, commonConfig, 'core.repositoryFormatVersion'), 'core.repositoryFormatVersion')
  const version = Number(versionText)
  if (!Number.isInteger(version) || version < 0) throw new Error(`unsupported core.repositoryFormatVersion: ${JSON.stringify(versionText)}`)
  if (version === 0) {
    const extensions = nul(git(root, ['config', '--file', commonConfig, '--no-includes', '--null', '--name-only', '--get-regexp', '^extensions\\.'], { allowStatuses: [1] }))
    if (extensions.length > 0) throw new Error(`cannot upgrade repository format while dormant extension ${extensions[0]} is configured`)
  }
  const worktree = one(directValues(root, commonConfig, 'core.worktree'), 'core.worktree')
  if (worktree !== undefined) throw new Error(`cannot enable worktree config while core.worktree is in ${commonConfig}`)
  const bareText = one(directValues(root, commonConfig, 'core.bare'), 'core.bare')
  const bare = bareText === undefined ? undefined : parseBoolean(bareText, 'core.bare')
  if (bare === true) throw new Error('cannot enable worktree config for a bare repository')
  return { version, enabled: extensionEnabled(root, commonConfig), bare }
}

function applyMigration(root, commonConfig, migration) {
  if (migration.version === 0) git(root, ['config', '--file', commonConfig, 'core.repositoryFormatVersion', '1'])
  if (!migration.enabled) git(root, ['config', '--file', commonConfig, 'extensions.worktreeConfig', 'true'])
  if (migration.bare === false) git(root, ['config', '--file', commonConfig, '--unset-all', 'core.bare'])
}

const markerText = hooksPath => `${JSON.stringify({ version: 1, owner: OWNER, hooksPath }, null, 2)}\n`

function inspectOwnedDirectory(path) {
  const directory = stat(path)
  if (directory === undefined) return undefined
  if (!directory.isDirectory() || directory.isSymbolicLink()) throw new Error(`refusing non-directory or symlinked hooks path ${path}`)
  const markerPath = join(path, OWNERSHIP_MARKER)
  const marker = stat(markerPath)
  if (marker === undefined) throw new Error(`refusing to overwrite unowned hooks directory ${path}`)
  if (!marker.isFile() || marker.isSymbolicLink() || marker.nlink !== 1) throw new Error(`invalid hooks ownership marker at ${markerPath}`)
  let parsed
  try { parsed = JSON.parse(readFileSync(markerPath, 'utf8')) } catch { /* handled below */ }
  if (parsed?.version !== 1 || parsed.owner !== OWNER || !isAbsolute(parsed.hooksPath)) throw new Error(`invalid hooks ownership marker at ${markerPath}`)
  for (const name of readdirSync(path)) {
    if (lstatSync(join(path, name)).isSymbolicLink()) throw new Error(`refusing symlink inside owned hooks directory: ${join(path, name)}`)
  }
  return { markerPath, hooksPath: parsed.hooksPath }
}

function ensureOwnedDirectory(path) {
  const existing = inspectOwnedDirectory(path)
  if (existing !== undefined) return existing
  mkdirSync(path, { mode: 0o700 })
  const markerPath = join(path, OWNERSHIP_MARKER)
  writeFileSync(markerPath, markerText(path), { flag: 'wx', mode: 0o600 })
  return { markerPath, hooksPath: path }
}

function isRegisteredOwnedPath(root, common, path) {
  for (const config of worktreeConfigs(common)) {
    if (stat(config) === undefined) continue
    if (directValues(root, config, 'core.hooksPath').some(value => samePath(value, path))) {
      return inspectOwnedDirectory(path)?.hooksPath === path
    }
  }
  return false
}

function lockStat(path) {
  const value = stat(path)
  if (value !== undefined && (!value.isFile() || value.isSymbolicLink())) throw new Error(`invalid Lefthook installer lock ${JSON.stringify(path)}`)
  return value
}

function lockOwner(record) {
  const match = /^([1-9]\d*) [0-9a-f-]{36}\n$/i.exec(record)
  return match === null ? undefined : Number(match[1])
}

function alive(pid) {
  try { process.kill(pid, 0); return true } catch (error) { if (errorCode(error) === 'ESRCH') return false; if (errorCode(error) === 'EPERM') return true; throw error }
}

async function acquireLock(common) {
  const path = join(common, LOCK_NAME)
  const record = `${process.pid} ${randomUUID()}\n`
  const deadline = Date.now() + LOCK_TIMEOUT_MS
  let incompleteSince
  for (;;) {
    try {
      const handle = openSync(path, 'wx', 0o600)
      let owned
      try {
        owned = fstatSync(handle)
        const delay = Number(process.env.VIBE_INIT_TEST_LEFTHOOK_LOCK_WRITE_DELAY_MS ?? 0)
        if (delay > 0) await new Promise(done => setTimeout(done, delay))
        writeFileSync(handle, record)
      } finally { closeSync(handle) }
      return () => {
        const current = lockStat(path)
        if (current === undefined || current.dev !== owned.dev || current.ino !== owned.ino || readFileSync(path, 'utf8') !== record) {
          throw new Error(`Lefthook installer lock ownership changed for ${path}; refusing to remove it`)
        }
        unlinkSync(path)
      }
    } catch (error) {
      if (errorCode(error) !== 'EEXIST') throw error
      const current = lockStat(path)
      const text = current === undefined ? undefined : readFileSync(path, 'utf8')
      const owner = text === undefined ? undefined : lockOwner(text)
      if (owner === undefined) {
        incompleteSince ??= Date.now()
        if (Date.now() - incompleteSince > LOCK_INITIALIZATION_TIMEOUT_MS) throw new Error(`invalid Lefthook installer lock ${JSON.stringify(path)}; remove it manually after confirming no installer is running`)
      } else {
        incompleteSince = undefined
        if (!alive(owner)) throw new Error(`stale Lefthook installer lock ${JSON.stringify(path)}; remove it manually after confirming no installer is running`)
      }
      if (Date.now() >= deadline) throw new Error(`timed out waiting for Lefthook installer lock ${path}`)
      await new Promise(done => setTimeout(done, LOCK_POLL_MS))
    }
  }
}

function renderConfig() {
  const packageJson = JSON.parse(readFileSync(join(HOME, 'package.json'), 'utf8'))
  const pairing = typeof packageJson.scripts?.['verify-translation-pairing'] === 'string' ? [
    '    - name: translation pairing (staged records)',
    "      glob: '*.i18n.yaml'",
    '      exclude:',
    "        - '.agents/notes/archived/**'",
    '      run: pnpm -C .vibe-init/toolchain run verify-translation-pairing --cached {staged_files}',
    '',
  ] : []
  const integrity = [
    ...pairing,
    '    - name: archived agent notes',
    "      glob: '.agents/notes/archived/**'",
    '      run: pnpm -C .vibe-init/toolchain run verify-archived-agent-notes',
  ]
  return [CONFIG_MARKER,
    '# Local hooks stay narrow; CI owns exhaustive and platform-matrix checks when available.', '',
    'pre-commit:', '  jobs:', ...integrity, '',
    '    - name: whitespace (staged)', '      run: git diff --cached --check', '',
    'pre-merge-commit:', '  jobs:', ...integrity, '',
    'pre-push:', '  jobs:', '    - name: documentation gates',
    '      run: pnpm -C .vibe-init/toolchain run doc-sync', '',
  ].join('\n')
}

function configPlan(path, content) {
  const entry = stat(path)
  if (entry === undefined) return { previous: undefined, changed: true }
  if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`refusing non-regular Lefthook config ${path}`)
  const previous = readFileSync(path, 'utf8')
  if (!previous.startsWith(`${CONFIG_MARKER}\n`)) return { foreign: true, previous }
  return { previous, changed: previous !== content }
}

function atomicWrite(path, content) {
  const temporary = `${path}.vibe-init-${process.pid}-${randomUUID()}.tmp`
  try { writeFileSync(temporary, content, { flag: 'wx', mode: 0o644 }); renameSync(temporary, path) }
  finally { try { unlinkSync(temporary) } catch (error) { if (errorCode(error) !== 'ENOENT') throw error } }
}

function restoreConfig(path, previous) {
  if (previous === undefined) { try { unlinkSync(path) } catch (error) { if (errorCode(error) !== 'ENOENT') throw error } }
  else atomicWrite(path, previous)
}

function cleanGitEnvironment() {
  const env = { ...process.env }
  for (const key of Object.keys(env)) {
    const name = key.toUpperCase()
    if (name === 'GIT_CONFIG_PARAMETERS' || name === 'GIT_CONFIG_COUNT' || /^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(name)) delete env[key]
  }
  return env
}

function refusePath(entry) {
  const source = `${entry.origin}: ${JSON.stringify(entry.value)}`
  if (entry.scope === 'command') throw new Error(`refusing command-scoped core.hooksPath (${source})`)
  if (entry.scope === 'worktree') throw new Error(`refusing worktree-scoped core.hooksPath (${source})`)
  throw new Error(`refusing user-owned core.hooksPath (${source}); integrate it or rerun with ${ALLOW_OVERRIDE}=1`)
}

async function main() {
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') return
  const probe = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' })
  if (probe.status !== 0) return
  const root = trimGit(probe.stdout)
  const binary = join(HOME, 'node_modules', '.bin', process.platform === 'win32' ? 'lefthook.cmd' : 'lefthook')
  if (!existsSync(binary)) return
  const configPath = join(root, 'lefthook.yml')
  const nextConfig = renderConfig()
  const plannedConfig = configPlan(configPath, nextConfig)
  if (plannedConfig.foreign) {
    console.error(`[install-lefthook] ${configPath} exists without the vibe-init marker — not overwriting. Merge this configuration manually:`)
    console.error(nextConfig)
    return
  }

  assertGitVersion(root)
  const gitDirectory = trimGit(git(root, ['rev-parse', '--absolute-git-dir']).stdout)
  const commonOutput = trimGit(git(root, ['rev-parse', '--git-common-dir']).stdout)
  const common = isAbsolute(commonOutput) ? commonOutput : resolve(root, commonOutput)
  const commonConfig = join(common, 'config')
  const commonStat = stat(commonConfig)
  if (commonStat === undefined || !commonStat.isFile() || commonStat.isSymbolicLink()) throw new Error(`refusing non-regular common repository config ${commonConfig}`)
  const worktreeConfig = join(gitDirectory, 'config.worktree')
  const hooksPath = join(gitDirectory, HOOKS_DIRECTORY)
  const release = await acquireLock(common)
  let primaryError
  try {
    inspectWorktreeConfigs(root, common, commonConfig)
    const entries = includedEntries(root, worktreeConfig, 'core.hooksPath')
    const included = entries.find(entry => !originIs(entry.origin, root, worktreeConfig))
    if (included !== undefined) refusePath({ ...included, scope: 'worktree' })
    const previousPath = one(entries.map(entry => entry.value), 'worktree core.hooksPath')
    let owned = previousPath === undefined ? undefined : inspectOwnedDirectory(hooksPath)
    const copiedOwned = previousPath !== undefined && previousPath !== hooksPath && isRegisteredOwnedPath(root, common, previousPath)
    if (previousPath !== undefined && previousPath !== hooksPath && owned?.hooksPath !== previousPath && !copiedOwned) {
      refusePath({ scope: 'worktree', origin: `file:${worktreeConfig}`, value: previousPath })
    }
    const effective = effectiveEntry(root, 'core.hooksPath')
    const directOwned = previousPath !== undefined && (previousPath === hooksPath || owned?.hooksPath === previousPath || copiedOwned)
    const effectiveOwned = effective?.scope === 'worktree' && effective.value === previousPath && directOwned && originIs(effective.origin, root, worktreeConfig)
    if (effective !== undefined && !effectiveOwned && (!['system', 'global', 'local'].includes(effective.scope) || process.env[ALLOW_OVERRIDE] !== '1')) refusePath(effective)

    const migration = planMigration(root, commonConfig)
    owned = ensureOwnedDirectory(hooksPath)
    applyMigration(root, commonConfig, migration)
    let configWritten = false
    if (plannedConfig.changed) { atomicWrite(configPath, nextConfig); configWritten = true }
    let pathChanged = false
    try {
      git(root, ['config', '--worktree', 'core.hooksPath', hooksPath])
      pathChanged = previousPath !== hooksPath
      const installed = effectiveEntry(root, 'core.hooksPath')
      if (installed?.scope !== 'worktree' || installed.value !== hooksPath || !originIs(installed.origin, root, worktreeConfig)) throw new Error('worktree-local core.hooksPath did not become effective')
      const args = ['install', '--force']
      const result = process.platform === 'win32'
        ? spawnSync(`"${binary}"`, args, { cwd: root, env: cleanGitEnvironment(), stdio: 'inherit', shell: true })
        : spawnSync(binary, args, { cwd: root, env: cleanGitEnvironment(), stdio: 'inherit' })
      if (result.status !== 0) throw new Error(`lefthook install --force failed with status ${String(result.status)}`)
      writeFileSync(owned.markerPath, markerText(hooksPath), { mode: 0o600 })
    } catch (error) {
      const rollback = []
      if (pathChanged) try {
        if (previousPath === undefined) git(root, ['config', '--worktree', '--unset-all', 'core.hooksPath'])
        else git(root, ['config', '--worktree', 'core.hooksPath', previousPath])
      } catch (failure) { rollback.push(failure) }
      if (configWritten) try { restoreConfig(configPath, plannedConfig.previous) } catch (failure) { rollback.push(failure) }
      if (rollback.length > 0) throw new AggregateError([error, ...rollback], `Lefthook installation rollback failed: ${rollback.map(String).join('; ')}`)
      throw error
    }
    console.error('[install-lefthook] worktree-local hooks installed (narrow commit gates; doc-sync before push).')
  } catch (error) { primaryError = error; throw error }
  finally {
    try { release() } catch (error) {
      if (primaryError !== undefined) throw new AggregateError([primaryError, error], `Lefthook installation failed and lock release also failed: ${String(error)}`)
      throw error
    }
  }
}

try { await main() } catch (error) {
  console.error(`[install-lefthook] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
