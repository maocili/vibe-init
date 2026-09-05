// dsh-vibe —— DSH host 插件（安装器/管理器，本机 MVP 形态；同 dsh-obsidian-bridge 挂载先例）。
// 设计/挂载依据：DESIGN-dsh-vibe-plugin.md §6（挂载与生命周期）；挂载样例见
// cordis.patch.sample.yml。规则文本一律来自版本化规则包（默认仓库根 packages/），
// 本插件不硬编码任何规则内容（DESIGN §3）。
//
// M1 形态说明：apply() 在挂载时【不产生任何副作用】（不做自动物化），只校验规则包并就绪提示。
// 物化动作（init / upgrade / status / audit / hash；install-global 已按 REQUIREMENTS v1.0
// 退役——不写全局面）通过随附 CLI
// （bin/dsh-vibe.mjs，同一引擎 lib/engine.mjs）驱动；待会话工具注册 API 面验证后
// （DESIGN §6「待验证 API」），工具将直接调用引擎函数 —— 若不可用，回退方案为随包 skill 驱动。
import { loadPack } from './lib/pack.mjs'
import { defaultPackDir } from './lib/engine.mjs'

export const name = 'dsh-vibe'
export const version = '0.1.0'

export async function apply(/* ctx */) {
  try {
    const packDir = defaultPackDir()
    const pack = await loadPack(packDir)
    const cli = new URL('./bin/dsh-vibe.mjs', import.meta.url).pathname
    const problems = pack.problems.length ? ' (' + pack.problems.length + ' pack problem(s) — run "audit")' : ''
    console.log('[dsh-vibe] mounted — pack ' + pack.version + ' @ ' + packDir + problems)
    console.log('[dsh-vibe] M1 actions (project-only, REQUIREMENTS v1.0): node ' + cli + ' <init|upgrade|status|audit|hash> [--project <dir>] [--skill <name>] [--dry-run|--yes]')
  } catch (err) {
    console.warn('[dsh-vibe] mounted, but pack unavailable: ' + (err && err.message ? err.message : err))
  }
}
