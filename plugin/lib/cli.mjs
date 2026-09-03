// dsh-rules CLI — M1 command surface for the installer/manager plugin.
// Run directly (node bin/dsh-rules.mjs …) or through the Cordis mount; actions are also
// importable as plain functions so future in-session tools can drive them (DESIGN §6).
import { readdir } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { join } from 'node:path'
import { loadPack, hashPack } from './pack.mjs'
import {
  defaultPackDir, defaultDshHome, defaultSkillRoot, resolveProjectRoot,
  planProject, planGlobal, evaluatePlan, applyResults, summarize, auditExtras
} from './engine.mjs'

const USAGE = `dsh-rules <command> [options]

Commands (M1):
  init             Materialize project scope: .agents/notes skeleton + root AGENTS.md block
  upgrade          Alias of init for pack-version migration (same idempotent engine)
  install-global   Write global standing orders (~/.dsh/AGENTS.md segment) + optional skills
  status           Report installed/drifted state for project and global scopes (read-only)
  audit            status + pack integrity + old-residue heuristics (read-only)
  hash             Refresh manifest.json sha256 to current pack sources
  list-skills      List optional skills available in the pack (skills-optional/*)
  help             Show this help

Options:
  --project <dir>   Project to act on (default: cwd, resolved upward to the .git root)
  --pack <dir>      Rule pack directory (default: repo-sibling ../rules-pack)
  --dsh-home <dir>  DSH home resolving ~/.dsh targets (default: \$DSH_HOME or ~/.dsh)
  --skill-root <dir> User skill root for optional skills (default: ~/.agents/skills)
  --skill <name>    Install this optional skill (repeatable; install-global)
  --dry-run         Compute + preview only, never write
  --yes             Apply without interactive confirmation
  --force           Overwrite conflicting files (use with care — never for user notes)
  --json            Machine-readable output (status / audit / hash)
  -h, --help        Show this help
`

function parseArgs(argv) {
  const opts = { skills: [], positionals: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const take = (name) => { if (i + 1 >= argv.length) throw new Error('missing value for ' + name); return argv[++i] }
    if (a === '--project') opts.project = take(a)
    else if (a === '--pack') opts.pack = take(a)
    else if (a === '--dsh-home') opts.dshHome = take(a)
    else if (a === '--skill-root') opts.skillRoot = take(a)
    else if (a === '--skill') opts.skills.push(take(a))
    else if (a === '--dry-run') opts.dryRun = true
    else if (a === '--yes') opts.yes = true
    else if (a === '--force') opts.force = true
    else if (a === '--json') opts.json = true
    else if (a === '-h' || a === '--help') opts.help = true
    else if (a.startsWith('-')) throw new Error('unknown option: ' + a)
    else opts.positionals.push(a)
  }
  return opts
}

function log(msg) { console.log(msg) }
function err(msg) { console.error('[dsh-rules] ' + msg) }

async function load(packDir) {
  const pack = await loadPack(packDir)
  return pack
}

function rowLine(r) {
  const sym = r.action === 'dir' ? 'dir    ' : r.action === 'create' ? 'create ' : r.action === 'update' ? 'update ' : r.action === 'skip' ? 'skip   ' : r.action === 'conflict' ? 'conflict' : r.action === 'missing' ? 'missing' : r.action
  return sym + '  ' + r.label + (r.note ? '  (' + r.note + ')' : '')
}

async function reviewThenApply(label, plan, pack, opts) {
  const results = await evaluatePlan(plan, opts)
  const summary = summarize(results)
  const dirty = results.filter((r) => r.action === 'create' || r.action === 'update' || r.action === 'conflict')
  // always preview what would change (dir/skip rows stay quiet)
  for (const r of dirty) {
    log('  ' + rowLine(r))
    if (r.preview && r.action !== 'create') log(r.preview.text.split('\n').map((l) => '    ' + l).join('\n'))
  }
  if (opts.dryRun) {
    log('[dsh-rules] ' + label + ' (dry-run): would ' + (dirty.length ? dirty.map((r) => r.action).join(', ') + ' on ' + dirty.length + ' item(s)' : 'do nothing') + '; conflicts: ' + results.filter((r) => r.action === 'conflict').length)
    return { results, summary, dry: true }
  }
  if (opts.json) return { results, summary, dry: false }
  const blocked = results.filter((r) => r.action === 'conflict' || r.action === 'missing')
  if (blocked.length) {
    for (const r of blocked) err((r.action === 'conflict' ? 'conflict (not overwritten): ' : 'missing: ') + r.label)
  }
  const pending = results.filter((r) => r.action === 'create' || r.action === 'update')
  if (!pending.length) { log('[dsh-rules] ' + label + ': nothing to do (already up to date)'); return { results, summary, applied: [] } }
  const go = opts.yes ? true : await confirm(label + ' — apply ' + pending.length + ' change(s), keep ' + blocked.length + ' conflict(s) untouched?')
  if (!go) { log('[dsh-rules] ' + label + ': aborted by user — no files written'); return { results, summary, applied: [] } }
  const applied = await applyResults(results)
  log('[dsh-rules] ' + label + ': applied ' + applied.length + ' change(s)')
  return { results, summary, applied }
}

function confirm(promptText) {
  if (!process.stdout.isTTY) throw new Error('non-interactive: pass --yes to apply or --dry-run to preview')
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(promptText + ' [y/N] ', (ans) => { rl.close(); resolvePromise(/^y(es)?$/i.test(ans.trim())) })
  })
}

export async function main(argv, io = {}) {
  const out = io.out || ((s) => log(s))
  let opts
  try { opts = parseArgs(argv) } catch (e) { err(e.message); out(USAGE); return 2 }
  if (opts.help || opts.positionals.length === 0) { out(USAGE); return opts.help ? 0 : 2 }
  const command = opts.positionals[0]
  const packDir = opts.pack || defaultPackDir()
  let pack
  try { pack = await load(packDir) } catch (e) { err('cannot load pack at ' + packDir + ': ' + e.message); return 2 }
  for (const p of pack.problems) err('pack problem: ' + p)

  try {
    if (command === 'hash') {
      const r = await hashPack(packDir)
      out('[dsh-rules] hash refreshed: ' + r.changed + '/' + r.count + ' entries in ' + packDir)
      if (opts.json) out(JSON.stringify({ changed: r.changed, version: r.version, dir: packDir }))
      return pack.problems.length ? 1 : 0
    }
    if (command === 'list-skills') {
      const dir = join(packDir, 'skills-optional')
      let names = []
      try { names = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort() } catch { }
      out('[dsh-rules] optional skills in pack: ' + (names.length ? names.join(', ') : '(none)'))
      if (opts.json) out(JSON.stringify({ skills: names }))
      return 0
    }

    const dshHome = opts.dshHome || defaultDshHome()
    const projectRoot = opts.project ? await resolveProjectRoot(opts.project) : await resolveProjectRoot(process.cwd())
    const skillRoot = opts.skillRoot || defaultSkillRoot()
    const scopeOpts = { force: !!opts.force, skills: opts.skills, skillRoot }

    if (command === 'init' || command === 'upgrade') {
      const plan = await planProject(pack, projectRoot)
      out('[dsh-rules] ' + command + ' — pack ' + pack.version + ' @ ' + pack.dir)
      out('  project: ' + plan.projectRoot)
      const r = await reviewThenApply(command, plan, pack, Object.assign({}, opts, { verbose: true }), 'project')
      if (opts.json) out(JSON.stringify({ command, project: plan.projectRoot, summary: r.summary, results: r.results.map((x) => ({ action: x.action, label: x.label })) }))
      return 0
    }
    if (command === 'install-global') {
      const plan = await planGlobal(pack, dshHome, scopeOpts)
      out('[dsh-rules] install-global — pack ' + pack.version + ' @ ' + pack.dir)
      out('  dsh home: ' + dshHome + '  skill root: ' + plan.skillRoot)
      const r = await reviewThenApply('install-global', plan, pack, Object.assign({}, opts, { verbose: true }), 'global')
      if (opts.json) out(JSON.stringify({ command, dshHome, skillRoot: plan.skillRoot, summary: r.summary }))
      return 0
    }
    if (command === 'status' || command === 'audit') {
      const pPlan = await planProject(pack, projectRoot)
      const gPlan = await planGlobal(pack, dshHome, scopeOpts)
      const pRes = await evaluatePlan(pPlan, {})
      const gRes = await evaluatePlan(gPlan, {})
      const extras = command === 'audit' ? await auditExtras(pack, projectRoot) : []
      if (opts.json) {
        const payload = {
          pack: { dir: pack.dir, version: pack.version, problems: pack.problems },
          project: { root: projectRoot, results: pRes.map((x) => ({ action: x.action, label: x.label })), summary: summarize(pRes) },
          global: { dshHome, results: gRes.map((x) => ({ action: x.action, label: x.label })), summary: summarize(gRes) },
          notes: extras
        }
        out(JSON.stringify(payload))
      } else {
        out('[dsh-rules] ' + command + ' — pack ' + pack.version + ' @ ' + pack.dir)
        out('project scope (' + projectRoot + '):')
        for (const r of pRes) out('  ' + rowLine(r))
        out('global scope (dshHome=' + dshHome + '):')
        for (const r of gRes) out('  ' + rowLine(r))
        for (const n of extras) out('  [' + n.level + '] ' + n.what + ': ' + n.detail)
      }
      const flagged = pack.problems.length || extras.some((n) => n.level === 'warn' || n.level === 'flag')
      return flagged ? 1 : 0
    }
    err('unknown command: ' + command)
    out(USAGE)
    return 2
  } catch (e) {
    err(e && e.message ? e.message : String(e))
    return 1
  }
}
