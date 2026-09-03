# plugin/ — dsh-rules 插件源码（host 层）

> 状态：**M1 引擎已实现**（纯 Node、零依赖，可独立运行与验收）；挂载样例与待验证 API 面见下文。
> 设计依据根 `DESIGN-dsh-rules-plugin.md`（草案曾名 dsh-discipline，定案见 DESIGN §10
> 问题 1：插件名与命令前缀 **dsh-rules**、规则包目录 `rules-pack/`）。

## 目录内容

| 文件 | 说明 |
|---|---|
| `dsh-rules.mjs` | 插件本体（Cordis host 插件：`export const name` + `apply(ctx)`）。挂载时无副作用，只校验规则包并就绪提示 |
| `cordis.patch.sample.yml` | 挂载样例：合并进 `~/.dsh/profiles/web/cordis.patch.yml` 的 insert 条目 |
| `bin/dsh-rules.mjs` | CLI 入口（`node bin/dsh-rules.mjs <command>`） |
| `lib/cli.mjs` | 命令面解析与输出（可 import，供未来会话工具复用） |
| `lib/engine.mjs` | 物化引擎：plan → evaluate → apply；marker 段 upsert/移除；幂等与冲突策略 |
| `lib/pack.mjs` | 规则包加载：manifest 解析、sha256、`[实现期]` 头注剥离、目录枚举 |
| `lib/diff.mjs` | 行级 diff（写前差异预览） |
| `package.json` | name `dsh-rules`；`bin.dsh-rules`；type module |

## 定位（DESIGN §3/§6）

- **只做安装器/管理器**：物化 + 幂等 + 迁移；规则文本一律来自版本化规则包 `../rules-pack/`。
- 写 `~/.dsh` 等 host 文件不走会话文件沙箱（挂载即 host 层）；写项目内容前**先展示差异、
  用户确认**（CLI 交互确认，或用 `--dry-run` 预览加 `--yes` 显式执行）。
- `apply(ctx)` 刻意不自动物化：一切动作由显式命令/工具触发，避免加载即改盘。

## M1 命令面（CLI：`dsh-rules <command>`，草案对齐 DESIGN §5）

| 命令 | 作用对象 | 行为 |
|---|---|---|
| `init` | 当前项目 | 生成 `.agents/notes/` 骨架（整树镜像、绝不覆盖已有笔记）+ 根 `AGENTS.md` marker 规则块（先差异后写入，幂等） |
| `upgrade` | 当前项目 | 同一引擎的显式别名：把规则包内容迁移到新版本（只动本插件物化的内容；用户编辑/漂移文件报 conflict 不动） |
| `install-global` | 本机 DSH | 写/更新 `~/.dsh/AGENTS.md` marker 段（保留段外用户编辑）+ 安装选中技能到用户技能根 |
| `status` | 当前项目/全局 | 只读：逐文件 ok / create / update / conflict / missing 汇总 |
| `audit` | 当前项目/全局 | status + 规则包完整性 + 旧残留启发（`.template/` 残留、`.agents/skills/dsh-*` 冗余、notes 顶层未知文件） |
| `hash` | 规则包 | 刷新 `rules-pack/manifest.json` 的 `sha256`（内容寻址） |
| `list-skills` | 规则包 | 列出 `skills-optional/` 可选技能 |

选项：`--project <dir>`（默认 cwd，向上找 `.git` 定界）· `--pack <dir>`（默认 repo 兄弟
`../rules-pack`，可 `$DSH_RULES_PACK`）· `--dsh-home <dir>`（默认 `$DSH_HOME` 或 `~/.dsh`）·
`--skill-root <dir>` · `--skill <name>`（可重复）· `--dry-run` · `--yes` · `--force` · `--json`。

非 TTY 且未给 `--yes` 或 `--dry-run` 时命令拒绝执行（不会挂起等待输入）。

## 物化语义（引擎要点）

- **骨架镜像**：`notes-skeleton/**` 整树镜像到 `<project>/.agents/notes/**`；`.gitkeep` 只保目录、
  不复制文件；源文件中的 `[实现期]/待填充/占位` 规划注释（整行 HTML 注释，任意位置）与
  legacy `dsh-rules:*` 标记行在物化前剥离，**规划注释永不进入消费者**（规则文本内的正文注释保留）。
- **marker 段**：每个受管段以 `<!-- dsh-rules:<entryId>:start -->` 与 `<!-- dsh-rules:<entryId>:end -->`
  包裹；重复执行/升级靠 id 原位替换，段外用户内容（产品 AGENTS.md 规则、全局文件既有编辑）
  一律保留。feature 关闭的行不创建段；曾经开启后关闭的行在下次运行时被移除。
- **冲突策略**：copy 型文件已存在且内容不同 → 报 `conflict` 并跳过（绝不覆盖），除非 `--force`；
  段型写入永不冲突（只动自己的段）。`status` 靠内容相等判断 ok/drift。
- **幂等**：第二次运行与第一次结果字节一致，报告 "nothing to do"。
- **安全测试**：用 `--project`/`--dsh-home` 指向临时目录即可完整演练；写真实 `~/.dsh`
  前命令会先展示计划并要求确认。

## 挂载与开放问题

1. 把 `cordis.patch.sample.yml` 的 insert 条目并入 `~/.dsh/profiles/web/cordis.patch.yml`
   （`name: file://…` 绝对路径指向本文件），重启 profile 后 `apply()` 打印就绪行即验证挂载。
2. 待验证 API（DESIGN §6）：`dsh-tools` 的 `defineTool` 会话工具注册 / GUI 菜单项注册。若可用，
   工具直接调用 `lib/engine.mjs` 的 plan/evaluate/apply；否则回退 = 插件做 host 物化 + 随包 skill
   驱动（与 dsh-translate-docs 同模式）。
3. M0 验证（DESIGN §8）：`install-global` 到真实 `~/.dsh` 后新开会话，确认全局规则注入与技能出现。
