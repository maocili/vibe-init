import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPack } from '../lib/pack.mjs'
import { planProject, evaluatePlan, applyResults } from '../lib/engine.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('materialized standing orders require one commit per completed step', async () => {
  const project = mkdtempSync(join(tmpdir(), 'vibe-init-commit-step-'))
  try {
    mkdirSync(join(project, '.git'))
    writeFileSync(join(project, 'AGENTS.md'), '# Product\n')
    const pack = await loadPack(join(ROOT, 'packages'))
    const plan = await planProject(pack, project)
    await applyResults(await evaluatePlan(plan, {}))
    const root = readFileSync(join(project, 'AGENTS.md'), 'utf8')
    assert.ok(root.includes('每完成一个可独立验证的 step'))
    assert.ok(root.includes('创建一个 Git commit'))
    assert.ok(root.includes('after each independently verifiable step'))
    assert.ok(root.includes('create one Git commit'))
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})
