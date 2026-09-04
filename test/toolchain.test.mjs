// dsh-rules docGates toolchain tests (node:test).
// Covers: default toolchain materialization (groups by feature), composed package.json,
// group enable/disable removal, user-edit protection, audit awareness, idempotency.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs'
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

const HOME = '.dsh-rules/toolchain'
const inHome = (proj, rel) => join(proj, HOME, rel)

async function applyInit(proj, features, packDir) {
  const pack = await loadPack(packDir || REAL_PACK)
  const plan = await planProject(pack, proj, features ? { features } : {})
  const results = await evaluatePlan(plan, features ? { features } : {})
  const applied = await applyResults(results)
  return { pack, plan, results, applied }
}

test('pack loads the toolchain spec with all groups', async () => {
  const pack = await loadPack(REAL_PACK)
  assert.ok(pack.toolchain)
  assert.equal(pack.toolchain.target, '.dsh-rules/toolchain')
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
  // no .gitkeep/spec artifacts inside the managed toolchain
  const tcFiles = applied.map((r) => r.label).filter((l) => l && l.startsWith('.dsh-rules/toolchain'))
  assert.ok(!tcFiles.some((l) => l.endsWith('.gitkeep') || l.endsWith('.spec.ts') || l.includes('test-fixture')))
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

test('composed package.json is deterministic for the same enabled set', async () => {
  const pack = await loadPack(REAL_PACK)
  const ids = new Set(pack.toolchain.groups.filter((g) => pack.features[g.feature] !== false || !g.feature).map((g) => g.id))
  const a = composeToolchainPackageJson(pack.toolchain, ids)
  const b = composeToolchainPackageJson(pack.toolchain, ids)
  assert.equal(a, b)
})
