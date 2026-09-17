// vibe-init docGates toolchain tests (node:test).
// Covers: default toolchain materialization (groups by feature), composed package.json,
// group enable/disable removal, user-edit protection, audit awareness, idempotency.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPack } from '../lib/pack.mjs'
import { planProject, evaluatePlan, applyResults, auditExtras, composeToolchainPackageJson } from '../lib/engine.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REAL_PACK = join(ROOT, 'packages')
let TMP

before(() => { TMP = mkdtempSync(join(ROOT, '.toolchain-test-')) })
after(() => { rmSync(TMP, { recursive: true, force: true }) })

function fixtureProject(name) {
  const dir = join(TMP, name)
  mkdirSync(join(dir, '.git'), { recursive: true })
  writeFileSync(join(dir, 'AGENTS.md'), '## Demo project\n')
  return dir
}

function makePack() {
  const dir = join(TMP, 'pack-' + Math.random().toString(36).slice(2))
  cpSync(REAL_PACK, dir, { recursive: true })
  return dir
}

const HOME = '.vibe-init/toolchain'
const inHome = (proj, rel) => join(proj, HOME, rel)

async function applyInit(proj, features, packDir) {
  const pack = await loadPack(packDir || REAL_PACK)
  const plan = await planProject(pack, proj, features ? { features } : {})
  const results = await evaluatePlan(plan, features ? { features } : {})
  const applied = await applyResults(results)
  return { pack, plan, results, applied }
}

function gitBlobHash(content) {
  return createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex')
}

test('pack loads the toolchain spec with all groups', async () => {
  const pack = await loadPack(REAL_PACK)
  assert.ok(pack.toolchain)
  assert.equal(pack.toolchain.target, '.vibe-init/toolchain')
  assert.equal(pack.toolchain.feature, 'docGates')
  const ids = pack.toolchain.groups.map((g) => g.id).sort()
  assert.deepEqual(ids, ['base', 'bilingual', 'doc-budgets', 'extras', 'hooks', 'scaffold', 'text-link'].sort())
  assert.equal(pack.features.docGates, true)
  assert.equal(pack.features.docGatesExtras, false)
})

test('default init materializes scaffold + docGates/base + default-on groups only', async () => {
  const proj = fixtureProject('default-on')
  const { applied } = await applyInit(proj)
  // scaffold
  assert.ok(existsSync(inHome(proj, 'package.json')))
  assert.ok(existsSync(inHome(proj, 'tsconfig.json')))
  assert.ok(existsSync(inHome(proj, 'pnpm-workspace.yaml')))
  assert.ok(existsSync(inHome(proj, 'README.md')))
  assert.ok(existsSync(inHome(proj, 'scripts/AGENTS.md')))
  // hooks (T3, default under docGates)
  assert.ok(existsSync(inHome(proj, 'scripts/install-lefthook.mjs')))
  // base gates + helpers (md-wrap is opt-in under docGatesExtras, not default)
  assert.ok(!existsSync(inHome(proj, 'scripts/verify-md-wrap.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/verify-agent-note-format.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/archived-agent-notes.ts')))
  // default-on groups: text-link, doc-budgets
  assert.ok(existsSync(inHome(proj, 'scripts/verify-md-links.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/verify-doc-budgets.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/doc-budgets.manifest.json')))
  assert.ok(existsSync(join(proj, 'docs', 'AGENTS.md')))
  // default-off groups NOT materialized
  assert.ok(!existsSync(inHome(proj, 'scripts/verify-translation-pairing.ts')))
  assert.ok(!existsSync(inHome(proj, 'docs/i18n/terminology.md')))
  assert.ok(!existsSync(inHome(proj, 'scripts/verify-mermaid.ts')))
  // composed package.json: doc-sync chains only installed gates; no vitest/specs anywhere
  const pkg = JSON.parse(readFileSync(inHome(proj, 'package.json'), 'utf8'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-md-links'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-doc-budgets'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-agent-note-format'))
  assert.ok(!pkg.scripts['doc-sync'].includes('verify-translation-pairing'))
  assert.ok(!pkg.scripts['doc-sync'].includes('verify-mermaid'))
  assert.equal(pkg.scripts.postinstall, 'node scripts/install-lefthook.mjs')
  assert.ok(!pkg.devDependencies.vitest)
  assert.ok(!pkg.devDependencies.jsdom)
  assert.ok(pkg.devDependencies.lefthook)
  const installer = readFileSync(inHome(proj, 'scripts/install-lefthook.mjs'), 'utf8')
  assert.match(installer, /VIBE_INIT_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE/)
  assert.match(installer, /vibe-init-hooks/)
  // no .gitkeep/spec artifacts inside the managed toolchain
  const tcFiles = applied.map((r) => r.label).filter((l) => l && l.startsWith('.vibe-init/toolchain'))
  assert.ok(!tcFiles.some((l) => l.endsWith('.gitkeep') || l.endsWith('.spec.ts') || l.includes('test-fixture')))
})

test('materialized markdown links are checked while package templates are not', async () => {
  const file = join(ROOT, 'docs', 'toolchain-link-test.md')
  writeFileSync(file, '[missing](missing.md)\n')
  try {
    const script = join(ROOT, '.vibe-init', 'toolchain', 'scripts', 'verify-md-links.ts')
    const runner = join(ROOT, '.vibe-init', 'toolchain', 'node_modules', 'tsx', 'dist', 'cli.mjs')
    const result = spawnSync(process.execPath, [runner, script], { cwd: ROOT, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.ok(result.stderr.includes('docs/toolchain-link-test.md'))
    assert.ok(!result.stderr.includes('packages/features/'))
    assert.ok(!result.stderr.includes('packages/docs/'))
    assert.ok(!result.stderr.includes('packages/skills/'))
    assert.ok(!result.stderr.includes('packages/notes-skeleton/'))
  } finally {
    rmSync(file, { force: true })
  }
})

test('Agent Note format gate rejects incomplete and stale active bilingual triplets', async () => {
  const proj = fixtureProject('active-note-triplets')
  await applyInit(proj)
  const noteDir = join(proj, '.agents', 'notes', 'implemented', 'bug-fix')
  mkdirSync(noteDir, { recursive: true })
  const source = '# Agent Note: close the gap\n\nStatus: implemented\n\n## Problem\n\nGap.\n\n## Decision\n\nCheck it.\n\n## Alternatives considered\n\n**Leave it.** The gap remains.\n\n## Consequences\n\nThe gate fails closed.\n'
  const chinese = '# Agent Note: 补齐缺口\n\nStatus: implemented\n\n## Problem\n\n存在缺口。\n\n## Decision\n\n检查它。\n\n## Alternatives considered\n\n**保持原状。** 缺口仍然存在。\n\n## Consequences\n\n门禁以失败关闭。\n'
  const stem = join(noteDir, '2026-09-17-close-the-gap')
  writeFileSync(`${stem}.md`, source)
  const script = inHome(proj, 'scripts/verify-agent-note-format.ts')
  const runner = join(ROOT, '.vibe-init', 'toolchain', 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const run = () => spawnSync(process.execPath, [runner, script], { cwd: proj, encoding: 'utf8' })

  const incomplete = run()
  assert.equal(incomplete.status, 1)
  assert.match(incomplete.stderr, /incomplete active triplet/)
  assert.match(incomplete.stderr, /2026-09-17-close-the-gap\.zh\.md/)
  assert.match(incomplete.stderr, /2026-09-17-close-the-gap\.i18n\.yaml/)

  writeFileSync(`${stem}.zh.md`, chinese)
  writeFileSync(`${stem}.i18n.yaml`, `2026-09-17-close-the-gap.md: ${gitBlobHash(source)}\n2026-09-17-close-the-gap.zh.md: ${gitBlobHash(chinese)}\n`)
  const complete = run()
  assert.equal(complete.status, 0, complete.stderr)

  writeFileSync(`${stem}.zh.md`, chinese + '\n失去同步。\n')
  const stale = run()
  assert.equal(stale.status, 1)
  assert.match(stale.stderr, /consistency record must contain the current Git blob hashes/)
})

test('Agent Note format gate permits English-only active Notes when pairing is disabled', async () => {
  const proj = fixtureProject('active-note-english-only')
  await applyInit(proj, { bilingualPairing: false })
  mkdirSync(join(proj, '.vibe-init'), { recursive: true })
  writeFileSync(join(proj, '.vibe-init', 'state.json'), JSON.stringify({ features: { bilingualPairing: false } }))
  const noteDir = join(proj, '.agents', 'notes', 'implemented', 'bug-fix')
  mkdirSync(noteDir, { recursive: true })
  writeFileSync(join(noteDir, '2026-09-17-english-only.md'), '# Agent Note: English only\n\nStatus: implemented\n\n## Problem\n\nGap.\n\n## Decision\n\nCheck it.\n\n## Alternatives considered\n\n**Require pairing.** The feature is disabled.\n\n## Consequences\n\nThe English Note remains valid.\n')
  const result = spawnSync(process.execPath, [
    join(ROOT, '.vibe-init', 'toolchain', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    inHome(proj, 'scripts/verify-agent-note-format.ts'),
  ], { cwd: proj, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})

test('init is idempotent for the toolchain (second run does nothing)', async () => {
  const proj = fixtureProject('idem')
  await applyInit(proj)
  const before = readFileSync(inHome(proj, 'package.json'), 'utf8')
  const { results } = await applyInit(proj)
  const dirty = results.filter((r) => r.action === 'create' || r.action === 'update' || r.action === 'remove')
  assert.deepEqual(dirty.map((r) => r.action), [])
  assert.equal(readFileSync(inHome(proj, 'package.json'), 'utf8'), before)
})

test('materialized bilingual prompt gate reads its toolchain-owned corpus', async () => {
  const proj = fixtureProject('bilingual-prompt-gate')
  const { results } = await applyInit(proj, { bilingualDocsDiscipline: true })
  await applyResults(results)
  const script = inHome(proj, 'scripts/verify-translation-prompt.ts')
  const result = spawnSync(process.execPath, [join(ROOT, '.vibe-init', 'toolchain', 'node_modules', 'tsx', 'dist', 'cli.mjs'), script], {
    cwd: proj,
    encoding: 'utf8',
    env: { ...process.env, VIBE_INIT_SKIP_TOOLCHAIN_INSTALL: '1' },
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /both directions render/)
})

test('bilingualDocsDiscipline on materializes G4 tooling + corpus; off removes managed copies', async () => {
  const proj = fixtureProject('bilingual')
  const { pack } = await applyInit(proj) // defaults first
  assert.ok(!existsSync(inHome(proj, 'scripts/verify-translation-pairing.ts')))
  // turn the discipline on
  await applyInit(proj, { bilingualDocsDiscipline: true })
  assert.ok(existsSync(inHome(proj, 'scripts/verify-translation-pairing.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/translation-pairing.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/translation-pairing.manifest.json')))
  assert.ok(existsSync(inHome(proj, 'scripts/doc-typecheck.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/verify-translation-prompt.ts')))
  assert.ok(existsSync(inHome(proj, 'docs/i18n/terminology.md')))
  assert.ok(existsSync(inHome(proj, 'docs/i18n/translation-rules.md')))
  assert.ok(existsSync(join(proj, '.agents', 'skills', 'translate-docs', 'SKILL.md')))
  const pairingGuide = readFileSync(inHome(proj, 'docs/i18n/README.md'), 'utf8')
  assert.ok(pairingGuide.includes('.agents/skills/translate-docs/SKILL.md'))
  assert.ok(!pairingGuide.includes('dsh-translate-docs'))
  const pkg = JSON.parse(readFileSync(inHome(proj, 'package.json'), 'utf8'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-translation-pairing'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-translation-prompt'))
  assert.ok(pkg.scripts['gen-translation-brief'])
  assert.ok(pkg.devDependencies['js-yaml'])
  // turn it back off: managed copies are removed, package.json recomposed
  const off = await applyInit(proj)
  const removals = off.results.filter((r) => r.action === 'remove')
  assert.ok(removals.some((r) => r.label.endsWith('verify-translation-pairing.ts')))
  assert.ok(removals.some((r) => r.label.includes('docs/i18n/terminology.md')))
  await applyResults(off.results)
  assert.ok(!existsSync(inHome(proj, 'scripts/verify-translation-pairing.ts')))
  assert.ok(!existsSync(inHome(proj, 'docs/i18n/terminology.md')))
  assert.ok(existsSync(inHome(proj, 'scripts/verify-md-links.ts'))) // other groups untouched
  const pkg2 = JSON.parse(readFileSync(inHome(proj, 'package.json'), 'utf8'))
  assert.ok(!pkg2.scripts['doc-sync'].includes('verify-translation-pairing'))
})

test('docGates=false removes the whole managed toolchain; user edits are never removed', async () => {
  const proj = fixtureProject('umbrella-off')
  await applyInit(proj)
  // user-edit one managed file
  const edited = inHome(proj, 'scripts/verify-doc-budgets.ts')
  writeFileSync(edited, readFileSync(edited, 'utf8') + '\n// user local tweak\n')
  // disable the umbrella
  const off = await applyInit(proj, { docGates: false })
  assert.ok(off.results.some((r) => r.action === 'remove'))
  const conflict = off.results.filter((r) => r.action === 'conflict')
  assert.ok(conflict.some((r) => r.label.endsWith('verify-doc-budgets.ts')))
  await applyResults(off.results)
  // unmodified managed files removed; the user-edit is kept
  assert.ok(!existsSync(inHome(proj, 'scripts/verify-md-links.ts')))
  assert.ok(!existsSync(inHome(proj, 'tsconfig.json')))
  assert.ok(existsSync(edited))
})

test('audit reports unexpected files inside the managed home but not node_modules/package.json', async () => {
  const proj = fixtureProject('audit-tc')
  const { pack } = await applyInit(proj)
  writeFileSync(inHome(proj, 'stray-note.md'), 'x\n')
  mkdirSync(join(proj, HOME, 'node_modules', 'tsx'), { recursive: true })
  writeFileSync(join(proj, HOME, 'node_modules', 'tsx', 'index.js'), 'x\n')
  const notes = await auditExtras(pack, proj)
  assert.ok(notes.some((n) => n.what === 'toolchain-extra' && n.detail.startsWith('stray-note.md')))
  assert.ok(!notes.some((n) => n.what === 'toolchain-extra' && n.detail.includes('node_modules')))
  assert.ok(!notes.some((n) => n.what === 'toolchain-extra' && n.detail.startsWith('package.json')))
})

test('docGatesExtras opt-in materializes md-wrap/mermaid gates with their deps', async () => {
  const proj = fixtureProject('extras')
  const { results } = await applyInit(proj, { docGatesExtras: true })
  await applyResults(results)
  assert.ok(existsSync(inHome(proj, 'scripts/verify-md-wrap.ts')))
  assert.ok(existsSync(inHome(proj, 'scripts/verify-mermaid.ts')))
  const pkg = JSON.parse(readFileSync(inHome(proj, 'package.json'), 'utf8'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-md-wrap'))
  assert.ok(pkg.scripts['doc-sync'].includes('verify-mermaid'))
  assert.ok(pkg.devDependencies.jsdom)
})

test('init reports a foreign toolchain package.json as a conflict, never overwrites', async () => {
  const proj = fixtureProject('init-foreign-pkg')
  mkdirSync(join(proj, '.vibe-init', 'toolchain'), { recursive: true })
  const foreign = JSON.stringify({ name: 'user-owned-toolchain' }, null, 2) + '\n'
  writeFileSync(join(proj, '.vibe-init', 'toolchain', 'package.json'), foreign)
  const pack = await loadPack(REAL_PACK)
  const plan = await planProject(pack, proj)
  const results = await evaluatePlan(plan, {})
  assert.equal(results.find((r) => r.id === 'toolchain:package.json').action, 'conflict')
  await applyResults(results)
  assert.equal(readFileSync(join(proj, '.vibe-init', 'toolchain', 'package.json'), 'utf8'), foreign)
})

test('init refreshes its own derived toolchain package.json for feature-composition changes', async () => {
  const proj = fixtureProject('init-derived-pkg')
  await applyInit(proj) // defaults first
  // turn the discipline on: derived package.json is managed, other files materialize
  await applyInit(proj, { bilingualDocsDiscipline: true })
  const pkg = JSON.parse(readFileSync(inHome(proj, 'package.json'), 'utf8'))
  assert.equal(pkg.name, 'vibe-init-toolchain')
  assert.ok(pkg.scripts['doc-sync'].includes('verify-translation-pairing'))
  assert.ok(existsSync(inHome(proj, 'scripts/verify-translation-pairing.ts')))
})

test('composed package.json is deterministic for the same enabled set', async () => {
  const pack = await loadPack(REAL_PACK)
  const ids = new Set(pack.toolchain.groups.filter((g) => pack.features[g.feature] !== false || !g.feature).map((g) => g.id))
  const a = composeToolchainPackageJson(pack.toolchain, ids)
  const b = composeToolchainPackageJson(pack.toolchain, ids)
  assert.equal(a, b)
})
