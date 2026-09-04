# plugin/ — dsh-rules 插件源码（项目级初始化器）

> 状态：**M1 引擎已按 REQUIREMENTS v1.0 改造并通过冒烟验证**（纯 Node、零依赖，可独立运行与验收）。
> 需求/范围口径：`REQUIREMENTS-dsh-rules-plugin.md`（v1.0 定案）——**项目级初始化器，不触碰全局面**
> （~/.dsh/AGENTS.md、用户技能根永不写入）；实现方案细节以根 `DESIGN-dsh-rules-plugin.md` 为准
> （已按 v1.0 对齐修订：全局面设计移除）。

## 目录内容

| 文件 | 说明 |
|---|---|
| `dsh-rules.mjs` | 插件本体（Cordis host 插件：`export const name` + `apply(ctx)`）。挂载时无副作用，只校验规则包并就绪提示 |
| `cordis.patch.sample.yml` | 挂载样例：合并进 `~/.dsh/profiles/web/cordis.patch.yml` 的 insert 条目 |
| `bin/dsh-rules.mjs` | CLI 入口（`node bin/dsh-rules.mjs <command>`） |
| `lib/cli.mjs` | 命令面解析与输出（可 import，供未来会话工具复用） |
| `lib/engine.mjs` | 物化引擎：plan → evaluate → apply；marker 段 upsert/移除；同文件多段按序累积写；幂等与冲突策略 |
| `lib/pack.mjs` | 规则包加载：manifest 解析、sha256、`[实现期]` 头注剥离、目录枚举 |
| `lib/diff.mjs` | 行级 diff（写前差异预览） |
| `package.json` | name `dsh-rules`；`bin.dsh-rules`；type module |

## 定位（REQUIREMENTS v1.0 / DESIGN §3）

- **只做项目级安装/管理器**：物化 + 幂等 + 迁移；规则与技能文本一律来自版本化规则包 `../rules-pack/`。
- **全局面退役**（v1.0 D1/D2）：`install-global` 已退役（调用返回明确错误）；manifest 不再含 `~/.dsh` 目标；
  status/audit 只报项目面。
- 写项目内容前**先展示差异、用户确认**（CLI 交互确认，或 `--dry-run` 预览 + `--yes` 显式执行）；
  非 TTY 且未给 `--yes`/`--dry-run` 时命令拒绝执行。
- `apply(ctx)` 刻意不自动物化：一切动作由显式命令/工具触发，避免加载即改盘。

## 命令面（CLI：`dsh-rules <command>`）

| 命令 | 作用对象 | 行为 |
|---|---|---|
| `init` | 当前项目 | 生成 `.agents/notes/` 骨架 + 根 `AGENTS.md` marker 规则段（note 纪律块 + 按 `manifest.features` 默认开启的特性段）+ `--skill` 挑选的技能副本 |
| `upgrade` | 当前项目 | 同一引擎的显式别名：把规则包内容迁移到新版本（只动本插件物化内容；用户编辑/漂移报 conflict 不动） |
| `status` | 当前项目 | 只读：逐文件 ok/create/update/conflict/missing 汇总（无全局面） |
| `audit` | 当前项目 | status + 规则包完整性（manifest sha256 漂移）+ 旧残留启发（`.template/` 残留、`.agents/skills/dsh-*` 冗余、notes 顶层未知文件） |
| `hash` | 规则包 | 刷新 `rules-pack/manifest.json` 的 `sha256`（内容寻址） |
| `list-skills` | 规则包 | 列出 `skills-optional/` 可选技能 |

选项：`--project <dir>`（默认 cwd，向上找 `.git` 定界）· `--pack <dir>`（默认 repo 兄弟 `../rules-pack`，可 `$DSH_RULES_PACK`）·
`--skill <name>`（可重复，复制技能进 `<project>/.agents/skills/<name>`）·
`--feature <key>=<true|false>`（可重复：本次运行覆盖 feature 默认值；关闭的既有段会被移除）·
`--dry-run` · `--yes` · `--force` · `--json`。

## 物化语义（引擎要点）

- **骨架镜像**：`notes-skeleton/**` 整树镜像到 `<project>/.agents/notes/**`；`.gitkeep` 只保目录、不复制文件；
  源文件中的 `[实现期]`/`待填充`/`占位` 规划注释（整行 HTML 注释）与 legacy `dsh-rules:*` 标记行在物化前剥离，
  **规划注释永不进入消费者**。
- **marker 段**：每段以 `<!-- dsh-rules:<entryId>:start -->`/`<!-- dsh-rules:<entryId>:end -->` 包裹；段块本身
  不带尾换行，段间空行由 upsert 统一排版——重复执行/升级字节稳定（幂等）。段外用户内容（产品 AGENTS.md 规则）一律保留。
  同文件多段在一次运行内**按序累积后再落盘**（新默认开多特性段时互不覆盖）。
- **技能副本**：`init --skill <name>` 把 `skills-optional/<name>` 复制到 `<project>/.agents/skills/<name>`；
  内容相等→skip，用户改动/自装→conflict（绝不覆盖，除非 `--force`）。**已选技能清单记录与移除、自装识别口径
  （REQUIREMENTS §7 DP-F/DP-G）暂缓**，v1 只保证「安装 + 幂等 + 不覆盖自装」。
- **冲突策略**：copy 型文件已存在且内容不同 → 报 `conflict` 并跳过（绝不覆盖），除非 `--force`；段型写入永不冲突。
- **幂等**：第二次运行与第一次结果字节一致，报告 "nothing to do"（已冒烟验证：连跑三次 init/upgrade 无写入）。
- **feature 默认值（v1.0）**：`textLinkManagement`/`bilingualPairing`/`docBudgets` 默认开；双语纪律段为独立 key `bilingualDocsDiscipline`、默认关。
  每次运行可用 `--feature <key>=<true|false>` 覆盖（按 key 合并、未覆盖者回落默认；关闭的段被移除），
  已冒烟验证默认态往返字节一致。
- **自动化测试**：`cd plugin && pnpm test`（node:test；临时目录自清理，17 条）：引擎层——cleanSource 剥离、
  段 upsert/移除幂等、同文件多段不互相覆盖且字节稳定、feature 门控合并（默认+按 key 覆盖）、e2e init 无占位
  泄漏/不覆盖用户内容、技能冲突保护、**upgrade 隔离（只更新版本变更段、笔记不动）**、**污染项目残留
  flag + 用户内容保护**、hashPack 漂移刷新、缺源报错、projectRoot 定界；CLI 层——help/未知命令、
  install-global 退役错误、init 幂等 + status/audit JSON 无全局面、hash 只作用于临时包副本、--feature 贯通。
- **安全演练**：用 `--project` 指向临时 git 项目即可完整演练；对真实项目写前会先展示计划并要求确认。

## 挂载与开放问题

1. **真实挂载（已执行，2026-09-03，用户同意）**：下列条目已并入 `~/.dsh/profiles/web/cordis.patch.yml`
   （与 dsh-obsidian-bridge 同机制；`file:////` 四斜杠为宿主惯用形态）。**已生效**：宿主重启日志含
   `[dsh-rules] mounted`（tmux `dsh:0.0`）；M2 在真实项目 `/Users/xuxifeng/Work/dsh-rules-demo` 验证通过。条目：

   ```yaml
   # dsh-rules: begin
   - insert:
       - id: dsh-rules
         name: file:////Users/xuxifeng/Work/dsh-rules/plugin/dsh-rules.mjs
   # dsh-rules: end
   ```

   重启 DSH profile 后日志出现 `[dsh-rules] mounted — pack …` 即挂载成功（`apply()` 无副作用）。
2. **挂载后验证清单（M2）**：新项目 `init --dry-run` → `init --yes`：骨架 + 根规则段生效、重跑幂等；
   `status`/`audit` 只读且无 pack-drift；含旧残留的项目 init 报 conflict/residue。
3. 待验证 API（DESIGN §6）：`dsh-tools` 的 `defineTool` 会话工具注册 / GUI 菜单项注册。若可用，工具直接调用
   `lib/engine.mjs` 的 plan/evaluate/apply；否则回退 = 插件做 host 物化 + 随包 skill 驱动。
4. 后续开发：docBudgets 轻量正文（物化目标待定）、DP-F/DP-G 解除后实现、M3 分发。
