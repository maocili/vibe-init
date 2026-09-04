// dsh-rules engine/pack regression tests (node:test).
// Fixtures live under the repository root and are removed after the run.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanSource, loadPack, hashPack } from '../lib/pack.mjs'
import {
  planProject, evaluatePlan, applyResults, upsertSegmentText, removeSegmentText,
  resolveProjectRoot, auditExtras
} from '../lib/engine.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REAL_PACK = join(ROOT, 'rules-pack')
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
  const skillDir = join(packDir, 'skills-optional', 'sample')
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
  await applyResults(await evaluatePlan(await planProject(pack1, proj), {}))
  const notesBefore = readFileSync(join(proj, '.agents', 'notes', 'AGENTS.md'), 'utf8')
  // pack author ships a new version of one rule segment only
  writeFileSync(join(packDir, 'standing-orders-block.md'), readFileSync(join(packDir, 'standing-orders-block.md'), 'utf8') + '\n- (v2) new standing line\n')
  const pack2 = await loadPack(packDir)
  const res = await evaluatePlan(await planProject(pack2, proj), {})
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
  const skill = join(packDir, 'skills-optional', 'prose-standard', 'references', 'examples.md')
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
