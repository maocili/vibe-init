import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPack } from '../lib/pack.mjs'
import { planProject, evaluatePlan, applyResults } from '../lib/engine.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readAgentFiles(root) {
  const files = new Map()
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.name === 'AGENTS.md') files.set(path.slice(root.length + 1), readFileSync(path, 'utf8'))
    }
  }
  visit(root)
  return files
}

async function materialize(features) {
  const project = mkdtempSync(join(tmpdir(), 'vibe-init-root-instructions-'))
  mkdirSync(join(project, '.git'))
  writeFileSync(join(project, 'AGENTS.md'), '# Product\n')
  const pack = await loadPack(join(ROOT, 'packages'))
  const plan = await planProject(pack, project, { features })
  await applyResults(await evaluatePlan(plan, {}))
  return { project, agents: readAgentFiles(project) }
}

test('materialized root instructions are concise English pointers without workflow details', async () => {
  const fixtures = []
  try {
    fixtures.push(await materialize(undefined))
    fixtures.push(await materialize({ bilingualDocsDiscipline: true }))

    for (const fixture of fixtures) {
      const root = fixture.agents.get('AGENTS.md')
      assert.ok(root)
      assert.match(root, /\[Agent Note rules\]\(.agents\/notes\/README\.md\)/)
      assert.match(root, /\[documentation standard\]\(docs\/AGENTS\.md\)/)
      assert.match(root, /pnpm -C \.vibe-init\/toolchain run doc-sync/)
      assert.doesNotMatch(root, /Alternatives considered|Commit discipline|independently verifiable step|^EN:/m)
      for (const [path, content] of fixture.agents) {
        assert.doesNotMatch(content, /[\u3400-\u9fff]/u, `${path} must be English-only`)
      }
    }
  } finally {
    for (const fixture of fixtures) rmSync(fixture.project, { recursive: true, force: true })
  }
})
