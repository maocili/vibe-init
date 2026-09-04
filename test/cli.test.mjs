// dsh-rules CLI integration tests (node:test): spawn the real bin.
// Uses a temp project fixture and a temp copy of the pack (real rules-pack is never mutated;
// hash runs only against the temp copy).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BIN = join(ROOT, 'bin', 'dsh-rules.mjs')
const REAL_PACK = join(ROOT, 'rules-pack')
let TMP

function run(args, opts = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', ...opts })
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
  const st = run(['status', '--project', proj, '--json'])
  assert.equal(st.code, 0)
  const json = JSON.parse(st.out)
  assert.ok('project' in json && !('global' in json))
  const aud = run(['audit', '--project', proj, '--json'])
  assert.equal(aud.code, 0)
  const audJson = JSON.parse(aud.out)
  assert.deepEqual(audJson.notes.filter((n) => n.what === 'pack-drift'), [])
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
  assert.ok(h2.out.includes('0/9'))
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
