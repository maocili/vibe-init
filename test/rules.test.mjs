// dsh-rules engine/pack regression tests (node:test).
// Fixtures live under the repository root and are removed after the run.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanSource, loadPack, hashPack } from '../lib/pack.mjs'
import {
  planProject, evaluatePlan, applyResults, upsertSegmentText, removeSegmentText,
  resolveProjectRoot, auditExtras
} from '../lib/engine.mjs'
import { nextProjectState, readProjectState, writeProjectState } from '../lib/state.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REAL_PACK = join(ROOT, 'packages')
let TMP

before(() => { TMP = mkdtempSync(join(ROOT, '.smoke-test-')) })
after(() => { rmSync(TMP, { recursive: true, force: true }) })

function fixtureProject(name) {
  const dir = join(TMP, name)
  mkdirSync(join(dir, '.git'), { recursive: true })
  return dir
}

function makePack() {
  const dir = join(mkdtempSync(join(TMP, 'pack-')), 'pack')
  cpSync(REAL_PACK, dir, { recursive: true })
  return dir
}

async function initAndRecord(pack, proj, opts = {}) {
  const plan = await planProject(pack, proj, { ...opts, mode: 'init' })
  const results = await evaluatePlan(plan, {})
  await applyResults(results)
  const state = nextProjectState(plan, results, pack.version, Object.assign({}, pack.features, opts.features || {}))
  await writeProjectState(proj, state)
  return { plan, results, state }
}

const planning = 'x\n<!-- 待填充 [实现期] header -->\ny\n<!-- dsh-rules:legacy -->\nz\n'

test('cleanSource strips planning/legacy marker comments, keeps body', async () => {
  const out = cleanSource(planning)
  assert.ok(!out.includes('[实现期]'))
  assert.ok(!out.includes('dsh-rules:legacy'))
  assert.ok(out.includes('x\n'))
  assert.ok(out.includes('y\n'))
  assert.ok(out.includes('z'))
})

test('segment upsert/remove is idempotent and preserves outside text', () => {
  const head = '## Product\n'
  let text = head
  text = upsertSegmentText(text, 'seg-a', 'body A')
  assert.ok(text.includes('<!-- dsh-rules:seg-a:start -->'))
  const again = upsertSegmentText(text, 'seg-a', 'body A')
  assert.equal(again, text)
  const removed = removeSegmentText(text, 'seg-a')
  assert.equal(removed, head.trimEnd() + '\n')
})

test('applyResults: two segments to one file both land (no clobber), byte-stable', async () => {
  const proj = fixtureProject('multiseg')
  const pack = await loadPack(REAL_PACK)
  writeFileSync(join(proj, 'AGENTS.md'), '## Demo\n')
  const plan = await planProject(pack, proj)
  const segs = plan.entries.filter((e) => e.kind === 'segment')
  const standing = segs.find((s) => s.id === 'project-standing-orders-block')
  const textlink = segs.find((s) => s.id === 'feature-text-link-management')
  assert.ok(standing && standing.enabled)
  assert.ok(textlink && textlink.enabled)
  const res = await evaluatePlan(plan, {})
  const out1 = await applyResults(res)
  assert.ok(out1.some((r) => r.id === 'project-standing-orders-block'))
  assert.ok(out1.some((r) => r.id === 'feature-text-link-management'))
  const file1 = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  // re-evaluate against the written file: everything already applied -> skip
  const res2 = await evaluatePlan(await planProject(pack, proj), {})
  assert.ok(res2.every((r) => r.action === 'skip' || r.action === 'dir'))
  const file2 = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.equal(file1, file2)
})

test('feature gating: defaults per manifest, run-level override merges per key', async () => {
  const proj = fixtureProject('features')
  const pack = await loadPack(REAL_PACK)
  const seg = async (features) => {
    const plan = await planProject(pack, proj, { features })
    return Object.fromEntries(plan.entries.filter((e) => e.kind === 'segment').map((e) => [e.id, e.enabled]))
  }
  const dflt = await seg(undefined)
  assert.equal(dflt['project-standing-orders-block'], true)
  assert.equal(dflt['feature-text-link-management'], true)   // manifest default true
  assert.equal(dflt['feature-bilingual-docs'], false)        // bilingualDocsDiscipline default false
  assert.equal(dflt['feature-doc-budgets'], true)            // docBudgets default true
  const offD = await seg({ docBudgets: false })
  assert.equal(offD['feature-doc-budgets'], false)
  const on = await seg({ bilingualDocsDiscipline: true })
  assert.equal(on['feature-bilingual-docs'], true)
  assert.equal(on['feature-text-link-management'], true)     // unmentioned keys fall back to defaults
  const off = await seg({ textLinkManagement: false })
  assert.equal(off['feature-text-link-management'], false)
  assert.equal(off['feature-bilingual-docs'], false)
})

test('e2e init: no planning-marker leak, no user-content clobber, idempotent', async () => {
  const proj = fixtureProject('e2e')
  const pack = await loadPack(REAL_PACK)
  writeFileSync(join(proj, 'AGENTS.md'), '## Product rules\n')
  const plan = await planProject(pack, proj)
  await applyResults(await evaluatePlan(plan, {}))
  // skeleton materialized with real content
  assert.ok(existsFile(join(proj, '.agents', 'notes', 'README.md')))
  assert.ok(existsFile(join(proj, '.agents', 'notes', 'README.zh.md')))
  // no planning markers leak into consumers
  const root = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.ok(!root.includes('实现期') && !root.includes('待填充'))
  assert.ok(root.includes('## Product rules'))
  // user tamper: product rule outside marker + notes edit
  writeFileSync(join(proj, 'AGENTS.md'), root + '\n## User added product rule\n')
  writeFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8') + '\nuser-edit\n')
  const res = await evaluatePlan(await planProject(pack, proj), {})
  const notesConflict = res.find((r) => r.label === '.agents/notes/AGENTS.md')
  assert.equal(notesConflict.action, 'conflict')
  const fileAfter = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.ok(fileAfter.includes('## User added product rule'))
  assert.ok(readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8').includes('user-edit'))
})

test('bilingualPairing controls note-pair artifacts and preserves user edits on removal', async () => {
  const proj = fixtureProject('note-pairing')
  writeFileSync(join(proj, 'AGENTS.md'), '## Product rules\n')
  const pack = await loadPack(REAL_PACK)

  await applyResults(await evaluatePlan(await planProject(pack, proj), {}))
  assert.ok(readFileSync(join(proj, '.agents', 'notes', 'README.md'), 'utf8').includes('](README.zh.md)'))
  const zh = join(proj, '.agents', 'notes', 'README.zh.md')
  const sidecar = join(proj, '.agents', 'notes', 'README.i18n.yaml')
  assert.ok(existsFile(zh))
  assert.ok(existsFile(sidecar))

  const disabledPlan = await planProject(pack, proj, { features: { bilingualPairing: false } })
  const disabled = await evaluatePlan(disabledPlan, {})
  assert.equal(disabled.find((r) => r.label === '.agents/notes/README.zh.md').action, 'remove')
  assert.equal(disabled.find((r) => r.label === '.agents/notes/README.i18n.yaml').action, 'remove')
  await applyResults(disabled)
  assert.ok(!existsFile(zh))
  assert.ok(!existsFile(sidecar))
  const english = readFileSync(join(proj, '.agents', 'notes', 'README.md'), 'utf8')
  assert.ok(!english.includes('](README.zh.md)'))
  assert.ok(!english.includes('](README.i18n.yaml)'))

  await applyResults(await evaluatePlan(await planProject(pack, proj), {}))
  assert.ok(readFileSync(join(proj, '.agents', 'notes', 'README.md'), 'utf8').includes('](README.zh.md)'))
  writeFileSync(zh, readFileSync(zh, 'utf8') + '\nuser translation\n')
  const protectedRemoval = await evaluatePlan(await planProject(pack, proj, { features: { bilingualPairing: false } }), {})
  assert.equal(protectedRemoval.find((r) => r.label === '.agents/notes/README.zh.md').action, 'conflict')
})

test('skills: copy into project, idempotent, user edit -> conflict not overwritten', async () => {
  const packDir = makePack()
  const skillDir = join(packDir, 'skills', 'sample')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), '# sample\n')
  const proj = fixtureProject('skills')
  writeFileSync(join(proj, 'AGENTS.md'), 'x\n')
  const pack = await loadPack(packDir)
  const plan = await planProject(pack, proj, { skills: ['sample'] })
  assert.ok(plan.entries.some((e) => e.id === 'skill:sample:SKILL.md'))
  const applied = await applyResults(await evaluatePlan(plan, {}))
  assert.ok(applied.some((r) => r.id === 'skill:sample:SKILL.md'))
  const again = await evaluatePlan(await planProject(pack, proj, { skills: ['sample'] }), {})
  assert.equal(again.find((r) => r.id === 'skill:sample:SKILL.md').action, 'skip')  // idempotent
  writeFileSync(join(proj, '.agents', 'skills', 'sample', 'SKILL.md'), '# user skill\n')
  const res = await evaluatePlan(await planProject(pack, proj, { skills: ['sample'] }), {})
  assert.equal(res.find((r) => r.id === 'skill:sample:SKILL.md').action, 'conflict')
})

test('default init installs every declared project skill', async () => {
  const proj = fixtureProject('default-skills')
  writeFileSync(join(proj, 'AGENTS.md'), 'x\n')
  const pack = await loadPack(REAL_PACK)
  const expected = pack.features.optionalSkills
  assert.equal(expected.length, 11)
  const results = await evaluatePlan(await planProject(pack, proj), {})
  await applyResults(results)
  for (const name of expected) {
    assert.ok(existsFile(join(proj, '.agents', 'skills', name, 'SKILL.md')), name)
    assert.ok(existsFile(join(proj, '.agents', 'skills', name, 'agents', 'openai.yaml')), name + ' metadata')
  }
  assert.ok(existsFile(join(proj, '.agents', 'skills', 'prose-standard', 'references', 'examples.md')))
  assert.ok(existsFile(join(proj, '.agents', 'skills', 'record-browser-gif', 'scripts', 'encode_gif.py')))
  assert.ok(existsFile(join(proj, '.agents', 'skills', 'trim-reasoning-leakage', 'references', 'examples.md')))
  assert.ok(existsFile(join(proj, '.agents', 'skills', 'trim-reasoning-leakage', 'references', 'recall-batteries.md')))
  const second = await evaluatePlan(await planProject(pack, proj), {})
  for (const name of expected) {
    assert.equal(second.find((r) => r.id === 'skill:' + name + ':SKILL.md').action, 'skip', name)
  }
})

test('materialized agent content keeps portable internal links', async () => {
  const proj = fixtureProject('portable-links')
  writeFileSync(join(proj, 'AGENTS.md'), 'x\n')
  const pack = await loadPack(REAL_PACK)
  await applyResults(await evaluatePlan(await planProject(pack, proj), {}))

  const root = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.ok(root.includes('[Agent Note 规则](.agents/notes/README.md)'))
  assert.ok(root.includes('[Agent Note rules](.agents/notes/README.md)'))

  const notes = readFileSync(join(proj, '.agents', 'notes', 'README.md'), 'utf8')
  assert.ok(notes.includes("[project root's AGENTS.md](../../AGENTS.md)"))
  const notesAgents = readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8')
  assert.ok(notesAgents.includes('[project root AGENTS.md](../../AGENTS.md)'))

  for (const skill of pack.skills) {
    const text = readFileSync(join(proj, '.agents', 'skills', skill.name, 'SKILL.md'), 'utf8')
    assert.match(text, /\]\(/, skill.name)
  }
})

test('shipped skill workflows are generic and bilingual guidance names the installed skill', async () => {
  const pack = await loadPack(REAL_PACK)
  for (const skill of pack.skills) {
    const text = readFileSync(join(REAL_PACK, 'skills', skill.name, 'SKILL.md'), 'utf8')
    assert.doesNotMatch(text, /deepseek-harness|DeepSeek Harness|Cordis|dsh-translate-docs/)
  }
  const bilingualFiles = [
    'toolchain/bilingual/docs/i18n/README.md',
    'toolchain/bilingual/docs/i18n/README.zh.md',
    'toolchain/bilingual/docs/i18n/translation-rules.md',
    'toolchain/bilingual/docs/i18n/translation-rules.zh.md',
    'toolchain/bilingual/docs/i18n/translation-prompt.md',
    'toolchain/bilingual/scripts/gen-translation-brief.ts',
    'toolchain/bilingual/scripts/translation-brief.ts',
  ]
  for (const rel of bilingualFiles) {
    const text = readFileSync(join(REAL_PACK, rel), 'utf8')
    assert.ok(!text.includes('dsh-translate-docs'), rel)
    assert.ok(text.includes('translate-docs'), rel)
  }
})

test('toolchain bilingual source pairs record their current contents', () => {
  const pairs = [
    ['toolchain/bilingual/docs/i18n/README.md', 'toolchain/bilingual/docs/i18n/README.zh.md', 'toolchain/bilingual/docs/i18n/README.i18n.yaml'],
    ['toolchain/bilingual/docs/i18n/translation-rules.md', 'toolchain/bilingual/docs/i18n/translation-rules.zh.md', 'toolchain/bilingual/docs/i18n/translation-rules.i18n.yaml'],
  ]
  const blobHash = (rel) => {
    const content = readFileSync(join(REAL_PACK, rel))
    return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')
  }
  for (const [source, zh, record] of pairs) {
    const sidecar = readFileSync(join(REAL_PACK, record), 'utf8')
    assert.match(sidecar, new RegExp(`^${source.split('/').at(-1)}: ${blobHash(source)}$`, 'm'))
    assert.match(sidecar, new RegExp(`^${zh.split('/').at(-1)}: ${blobHash(zh)}$`, 'm'))
  }
})

test('translate-docs remains explicit-only across its two invocation metadata formats', () => {
  const skill = readFileSync(join(REAL_PACK, 'skills', 'translate-docs', 'SKILL.md'), 'utf8')
  const metadata = readFileSync(join(REAL_PACK, 'skills', 'translate-docs', 'agents', 'openai.yaml'), 'utf8')
  assert.match(skill, /^disable-model-invocation: true$/m)
  assert.match(skill, /^user-invocable: true$/m)
  assert.match(metadata, /^  allow_implicit_invocation: false$/m)
})

test('every shipped skill must be declared as a default installation', async () => {
  const packDir = makePack()
  const manifestPath = join(packDir, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.features.optionalSkills.pop()
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  const pack = await loadPack(packDir)
  assert.ok(pack.problems.some(problem => problem.includes('is not default-installed')))
})

test('upgrade is isolated: only the version-changed segment updates, notes untouched', async () => {
  const packDir = makePack()
  const proj = fixtureProject('upgrade')
  writeFileSync(join(proj, 'AGENTS.md'), '## Product\n')
  const pack1 = await loadPack(packDir)
  await initAndRecord(pack1, proj)
  const notesBefore = readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8')
  // pack author ships a new version of one rule segment only
  writeFileSync(join(packDir, 'standing-orders-block.md'), readFileSync(join(packDir, 'standing-orders-block.md'), 'utf8') + '\n- (v2) new standing line\n')
  const pack2 = await loadPack(packDir)
  const res = await evaluatePlan(await planProject(pack2, proj, { mode: 'upgrade' }), {})
  const standing = res.find((r) => r.id === 'project-standing-orders-block')
  assert.equal(standing.action, 'update')
  const notesRes = res.find((r) => r.label === '.agents/notes/AGENTS.md')
  assert.equal(notesRes.action, 'skip')
  assert.equal(readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8'), notesBefore)
  await applyResults(res)   // apply the computed update
  const root = readFileSync(join(proj, 'AGENTS.md'), 'utf8')
  assert.ok(root.includes('(v2) new standing line'))
  assert.equal(readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8'), notesBefore)
})

test('upgrade ownership matrix: managed files overwrite while user assets stay byte-identical', async () => {
  const packDir = makePack()
  const proj = fixtureProject('upgrade-ownership')
  writeFileSync(join(proj, 'AGENTS.md'), '## Product\n## User section\n')
  const pack1 = await loadPack(packDir)
  await initAndRecord(pack1, proj)

  const managedSkill = join(proj, '.agents', 'skills', 'archive-agent-notes', 'SKILL.md')
  const managedTool = join(proj, '.dsh-rules', 'toolchain', 'scripts', 'verify-md-links.ts')
  const generatedDoc = join(proj, 'docs', 'AGENTS.md')
  const noteBody = join(proj, '.agents', 'notes', 'implemented', 'architecture', '2024-user-note.md')
  const noteManifest = join(proj, '.agents', 'notes', 'manifest.json')
  const businessDoc = join(proj, 'docs', 'business.md')
  const userTool = join(proj, '.dsh-rules', 'toolchain', 'user-script.ts')
  const userSkill = join(proj, '.agents', 'skills', 'archive-agent-notes', 'user-reference.md')
  writeFileSync(managedSkill, readFileSync(managedSkill, 'utf8') + '\nuser edit that upgrade must replace\n')
  writeFileSync(managedTool, readFileSync(managedTool, 'utf8') + '\nuser edit that upgrade must replace\n')
  writeFileSync(generatedDoc, readFileSync(generatedDoc, 'utf8') + '\nuser edit that upgrade must replace\n')
  mkdirSync(join(proj, '.agents', 'notes', 'implemented', 'architecture'), { recursive: true })
  writeFileSync(noteBody, '# User decision\nkeep this body\n')
  const manifestBefore = readFileSync(noteManifest, 'utf8')
  const businessBefore = '# business-owned documentation\n'
  mkdirSync(join(proj, 'docs'), { recursive: true })
  writeFileSync(businessDoc, businessBefore)
  writeFileSync(userTool, '# user tool\n')
  writeFileSync(userSkill, '# user reference\n')
  const noteBefore = readFileSync(noteBody, 'utf8')
  const toolSource = join(packDir, 'toolchain', 'text-link', 'scripts', 'verify-md-links.ts')
  writeFileSync(toolSource, readFileSync(toolSource, 'utf8') + '\n// pack v2\n')
  const skillSource = join(packDir, 'skills', 'archive-agent-notes', 'SKILL.md')
  writeFileSync(skillSource, readFileSync(skillSource, 'utf8') + '\nPack v2 guidance.\n')
  const docsSource = join(packDir, 'docs', 'AGENTS.md')
  writeFileSync(docsSource, readFileSync(docsSource, 'utf8') + '\nPack v2 docs guidance.\n')
  const standingSource = join(packDir, 'standing-orders-block.md')
  writeFileSync(standingSource, readFileSync(standingSource, 'utf8') + '\nPack v2 standing guidance.\n')
  await hashPack(packDir)
  const pack2 = await loadPack(packDir)
  const plan = await planProject(pack2, proj, { mode: 'upgrade' })
  const results = await evaluatePlan(plan, {})
  assert.equal(results.find((r) => r.id === 'skill:archive-agent-notes:SKILL.md').action, 'update')
  assert.equal(results.find((r) => r.id === 'toolchain:text-link:scripts/verify-md-links.ts').action, 'update')
  assert.equal(results.find((r) => r.label === 'docs/AGENTS.md').action, 'update')
  assert.equal(results.find((r) => r.id === 'project-standing-orders-block').action, 'update')
  assert.equal(results.find((r) => r.label === '.dsh-rules/toolchain/user-script.ts'), undefined)
  assert.equal(results.find((r) => r.label === '.agents/skills/archive-agent-notes/user-reference.md'), undefined)
  assert.equal(results.find((r) => r.label === '.agents/notes/implemented/architecture/2024-user-note.md'), undefined)
  assert.equal(results.find((r) => r.label === '.agents/notes/manifest.json'), undefined)
  assert.equal(results.find((r) => r.label === 'docs/business.md'), undefined)
  await applyResults(results)
  assert.equal(readFileSync(noteBody, 'utf8'), noteBefore)
  assert.equal(readFileSync(noteManifest, 'utf8'), manifestBefore)
  assert.equal(readFileSync(businessDoc, 'utf8'), businessBefore)
  assert.equal(readFileSync(userTool, 'utf8'), '# user tool\n')
  assert.equal(readFileSync(userSkill, 'utf8'), '# user reference\n')
  assert.ok(readFileSync(join(proj, 'AGENTS.md'), 'utf8').includes('## User section'))
  assert.ok(readFileSync(managedTool, 'utf8').includes('// pack v2'))
  assert.ok(readFileSync(managedSkill, 'utf8').includes('Pack v2 guidance.'))
  assert.ok(readFileSync(generatedDoc, 'utf8').includes('Pack v2 docs guidance.'))
})

test('upgrade removes only unmodified state-owned stale files and preserves modified ones', async () => {
  const packDir = makePack()
  const cleanProj = fixtureProject('upgrade-stale-clean')
  const changedProj = fixtureProject('upgrade-stale-changed')
  writeFileSync(join(cleanProj, 'AGENTS.md'), 'x\n')
  writeFileSync(join(changedProj, 'AGENTS.md'), 'x\n')
  const pack1 = await loadPack(packDir)
  await initAndRecord(pack1, cleanProj)
  await initAndRecord(pack1, changedProj)
  const staleRel = '.agents/skills/prose-standard/references/examples.md'
  writeFileSync(join(changedProj, staleRel), readFileSync(join(changedProj, staleRel), 'utf8') + '\nuser change\n')
  const manifestPath = join(packDir, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const skill = manifest.skills.find((s) => s.name === 'prose-standard')
  skill.files = skill.files.filter((f) => f.path !== 'references/examples.md')
  rmSync(join(packDir, 'skills', 'prose-standard', 'references', 'examples.md'))
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  await hashPack(packDir)
  const pack2 = await loadPack(packDir)
  const cleanPlan = await planProject(pack2, cleanProj, { mode: 'upgrade' })
  const cleanResults = await evaluatePlan(cleanPlan, {})
  assert.equal(cleanResults.find((r) => r.label === staleRel).action, 'remove')
  await applyResults(cleanResults)
  assert.ok(!existsFile(join(cleanProj, staleRel)))
  const changedPlan = await planProject(pack2, changedProj, { mode: 'upgrade' })
  const changedResults = await evaluatePlan(changedPlan, {})
  assert.equal(changedResults.find((r) => r.label === staleRel).action, 'conflict')
  await applyResults(changedResults)
  assert.ok(readFileSync(join(changedProj, staleRel), 'utf8').includes('user change'))
})

test('upgrade legacy migration reports ambiguous files, never deletes them, and creates state', async () => {
  const proj = fixtureProject('upgrade-legacy')
  writeFileSync(join(proj, 'AGENTS.md'), '## Product\n')
  mkdirSync(join(proj, '.dsh-rules', 'toolchain'), { recursive: true })
  writeFileSync(join(proj, '.dsh-rules', 'toolchain', 'legacy-user.ts'), 'user tool\n')
  const legacyDeclared = join(proj, '.dsh-rules', 'toolchain', 'docs', 'i18n', 'README.md')
  mkdirSync(join(proj, '.dsh-rules', 'toolchain', 'docs', 'i18n'), { recursive: true })
  writeFileSync(legacyDeclared, readFileSync(join(REAL_PACK, 'toolchain', 'bilingual', 'docs', 'i18n', 'README.md'), 'utf8'))
  const legacyDeclaredChanged = join(proj, '.dsh-rules', 'toolchain', 'docs', 'i18n', 'README.zh.md')
  writeFileSync(legacyDeclaredChanged, readFileSync(join(REAL_PACK, 'toolchain', 'bilingual', 'docs', 'i18n', 'README.zh.md'), 'utf8') + '\nuser translation\n')
  mkdirSync(join(proj, '.agents', 'skills', 'archive-agent-notes'), { recursive: true })
  writeFileSync(join(proj, '.agents', 'skills', 'archive-agent-notes', 'legacy-user.md'), 'user skill\n')
  mkdirSync(join(proj, '.agents', 'notes', 'implemented', 'architecture'), { recursive: true })
  writeFileSync(join(proj, '.agents', 'notes', 'implemented', 'architecture', '2024-history.md'), '# history\n')
  const pack = await loadPack(REAL_PACK)
  const plan = await planProject(pack, proj, { mode: 'upgrade' })
  const results = await evaluatePlan(plan, {})
  assert.equal(plan.stateInfo.state, null)
  assert.equal(results.find((r) => r.label === '.dsh-rules/toolchain/legacy-user.ts').action, 'conflict')
  assert.equal(results.find((r) => r.label === '.dsh-rules/toolchain/docs/i18n/README.md').action, 'remove')
  assert.equal(results.find((r) => r.label === '.dsh-rules/toolchain/docs/i18n/README.zh.md').action, 'conflict')
  assert.equal(results.find((r) => r.label === '.agents/skills/archive-agent-notes/legacy-user.md').action, 'conflict')
  assert.equal(results.find((r) => r.label === '.agents/notes/implemented/architecture/2024-history.md'), undefined)
  await applyResults(results)
  await writeProjectState(proj, nextProjectState(plan, results, pack.version, plan.effectiveFeatures))
  assert.ok(existsFile(join(proj, '.dsh-rules/state.json')))
  assert.ok(existsFile(join(proj, '.dsh-rules/toolchain/legacy-user.ts')))
  assert.ok(!existsFile(legacyDeclared))
  assert.ok(existsFile(legacyDeclaredChanged))
  assert.ok(existsFile(join(proj, '.agents/skills/archive-agent-notes/legacy-user.md')))
})

test('upgrade rejects malformed or duplicated marker segments as conflicts', async () => {
  const proj = fixtureProject('upgrade-marker-conflict')
  const pack = await loadPack(REAL_PACK)
  const marker = '<!-- dsh-rules:project-standing-orders-block:start -->\n'
  writeFileSync(join(proj, 'AGENTS.md'), marker + marker + '<!-- dsh-rules:project-standing-orders-block:end -->\n')
  const results = await evaluatePlan(await planProject(pack, proj, { mode: 'upgrade' }), {})
  assert.equal(results.find((r) => r.id === 'project-standing-orders-block').action, 'conflict')
})

test('upgrade removes a stale marker only when state confirms the old segment', async () => {
  const packDir = makePack()
  const proj = fixtureProject('upgrade-stale-marker')
  writeFileSync(join(proj, 'AGENTS.md'), '## Product\n')
  const pack1 = await loadPack(packDir)
  await initAndRecord(pack1, proj)
  const manifestPath = join(packDir, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.files = manifest.files.filter((row) => row.id !== 'project-standing-orders-block')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  const pack2 = await loadPack(packDir)
  const results = await evaluatePlan(await planProject(pack2, proj, { mode: 'upgrade' }), {})
  const stale = results.find((r) => r.label?.includes('project-standing-orders-block'))
  assert.ok(stale)
  assert.equal(stale.action, 'update')
  await applyResults(results)
  assert.ok(!readFileSync(join(proj, 'AGENTS.md'), 'utf8').includes('project-standing-orders-block:start'))
})

test('polluted project: residue flagged, user notes never clobbered', async () => {
  const proj = fixtureProject('polluted')
  writeFileSync(join(proj, 'AGENTS.md'), '## Product rules\n')
  mkdirSync(join(proj, '.template'), { recursive: true })                    // old copy residue
  mkdirSync(join(proj, '.agents', 'skills', 'dsh-old'), { recursive: true }) // dsh-* redundancy
  mkdirSync(join(proj, '.agents', 'notes', 'proposed'), { recursive: true })
  writeFileSync(join(proj, '.agents', 'notes', '2026-08-19-container-history.md'), '# old\n') // unknown top-level
  writeFileSync(join(proj, '.agents', 'notes', 'README.md'), '# user README — hand-edited\n')
  const pack = await loadPack(REAL_PACK)
  const extras = await auditExtras(pack, proj)
  const kinds = extras.map((n) => n.what)
  assert.ok(kinds.includes('residue-template'))
  assert.ok(kinds.includes('residue-skill'))
  assert.ok(kinds.includes('unknown-top-level'))
  const res = await evaluatePlan(await planProject(pack, proj), {})
  const readme = res.find((r) => r.label === '.agents/notes/README.md')
  assert.equal(readme.action, 'conflict')
  assert.equal(readFileSync(join(proj, '.agents', 'notes', 'README.md'), 'utf8'), '# user README — hand-edited\n')
})

test('hashPack refreshes sha256 after a pack source changes', async () => {
  const packDir = makePack()
  const target = join(packDir, 'standing-orders-block.md')
  writeFileSync(target, readFileSync(target, 'utf8') + '\nchanged\n')
  const out = await hashPack(packDir)
  assert.ok(out.changed >= 1)
  const pack = await loadPack(packDir)
  assert.equal(pack.problems.length, 0)
  const row = pack.rows.find((r) => r.id === 'project-standing-orders-block')
  assert.equal(row.declaredSha256, row.actualSha256)
})

test('skill assets are content-addressed and hash refresh repairs their drift', async () => {
  const packDir = makePack()
  const skill = join(packDir, 'skills', 'prose-standard', 'references', 'examples.md')
  writeFileSync(skill, readFileSync(skill, 'utf8') + '\nnew calibration\n')
  const drifted = await loadPack(packDir)
  assert.ok(drifted.problems.some(problem => problem.includes('prose-standard/references/examples.md sha256 drift')))
  const out = await hashPack(packDir)
  assert.ok(out.changed >= 1)
  const refreshed = await loadPack(packDir)
  assert.equal(refreshed.problems.length, 0)
})

test('loadPack reports rows whose source file is missing', async () => {
  const packDir = makePack()
  rmSync(join(packDir, 'standing-orders-block.md'), { force: true })
  const pack = await loadPack(packDir)
  assert.ok(pack.problems.some((m) => m.includes('missing source file')))
})

test('resolveProjectRoot stops at the nearest .git', async () => {
  const inner = fixtureProject('nested')
  const outer = join(inner, 'sub')
  mkdirSync(outer, { recursive: true })
  const root = await resolveProjectRoot(outer)
  assert.equal(root, inner)
})

function existsFile(p) {
  try { readFileSync(p); return true } catch { return false }
}
