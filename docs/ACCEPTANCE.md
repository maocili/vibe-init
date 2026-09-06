# ACCEPTANCE — REQUIREMENTS v1.0 逐条追溯

> 每条需求/决策给出实现证据（测试名、命令、代码事实）。测试入口：仓库根 `pnpm test`。范围权威：REQUIREMENTS-vibe-init.md（v1.0 定案）。未实现项均已标注（DP-G 仍待决定）。

## 决策基线（§0 D1–D14）

| 决策 | 证据 | 状态 |
|---|---|---|
| D1 不做全局规则/全局面 | `lib/` 无全局写入；CLI 测试覆盖 global surface retired | 达成 |
| D2 每个项目显式初始化 | planProject 仅项目面；CLI init/upgrade/status/audit/hash/list-skills 全部 `--project` 作用域 | 达成 |
| D3 textLink/bilingualPairing 默认开 | packages/manifest.json features + feature-gating 测试 | 达成 |
| D4 双语纪律段默认关 | manifest bilingualDocsDiscipline=false + gating 测试 + CLI 默认段测试 | 达成 |
| D5 全部技能 = 项目级副本（依赖包式） | default-skills 测试：默认复制/幂等；init 用户编辑冲突不覆盖；upgrade ownership 测试覆盖受管文件刷新与用户新增保留 | 达成 |
| D6/D7 本文档定案；实现细节记录在 Agent Note | 文档权威关系（AGENTS/REQUIREMENTS/实现设计 Note 头部） | 达成 |
| D8 根规则块指针式（短块指骨架） | standing-orders-block.md 内容形态 + e2e 物化后根 AGENTS.md 指针文案 | 达成 |
| D9 双语纪律段独立 key | manifest feature-bilingual-docs 行 feature=bilingualDocsDiscipline | 达成 |
| D10 docBudgets 默认开 | manifest feature-doc-budgets 行 + gating 测试 + CLI 默认段测试 | 达成 |
| D11 docGates 伞默认开启、extras 默认关闭 | manifest features + `toolchain/spec.json`；toolchain 测试覆盖默认物化集和 extras opt-in | 达成 |
| D12 工具链落点与分组门控 | toolchain 测试覆盖整目录移除、用户改动保留、bilingual 组和 hook 行为；foreign `lefthook.yml` 不覆盖 | 达成 |
| D13 upgrade 使用 state 做所有权迁移，文件/依赖成功后原子提交 | `lib/state.mjs`；ownership/stale/legacy/malformed-marker 测试；依赖失败测试 | 达成 |
| D14 standalone hard cut | package/bin 清单、schema 2 状态、旧 namespace 不变测试和 [standalone hard-cut Note](../.agents/notes/implemented/simplification/2026-09-06-standalone-vibe-init.md) | 达成（2026-09-06） |

## 行为需求（§2 R1–R12）

| 需求 | 证据 | 状态 |
|---|---|---|
| R1 项目显式初始化 | cli.test init 幂等 + e2e（rules.test） | 达成 |
| R2 绝不触碰全局面 | status JSON 无 global 键；lib 无全局写入 | 达成 |
| R3 全部技能依赖包式项目副本 | skill 测试（默认创建/幂等/conflict）+ upgrade ownership 测试（受管文件覆盖、用户新增保留） | 达成 |
| R4 只拿受管内容 | polluted 测试：旧 namespace 和未知内容只 flag 不物化 | 达成 |
| R5 内容单一出处 + sha256 | loadPack/hashPack 校验规则行和每个技能资产；技能资产漂移刷新测试 | 达成 |
| R6 绝不覆盖用户内容 | init conflict 测试；upgrade ownership 测试确认根段外、Agent Note 正文/manifest、业务 docs、技能/工具链用户新增均保留 | 达成 |
| R7 幂等 | 引擎与 CLI 双跑 nothing-to-do；多段字节稳定测试 | 达成 |
| R8 状态可观测 | status/audit JSON：逐项 action、无 global、state missing/outdated/drift/install-required 信息 | 达成 |
| R9 可安全演进（upgrade 隔离） | upgrade-isolation + ownership/stale/legacy 测试：受管覆盖、状态确认删除、用户资产/未知路径保留 | 达成 |
| R10 显式触发、安装无副作用 | CLI 安装和 dry-run 测试；engine apply 无隐式物化 | 达成 |
| R11 预览与确认 | CLI non-interactive 测试：无 `--yes` 拒绝；`--dry-run` 无状态/文件写入 | 达成 |
| R12 状态与依赖提交 | state 写入/幂等测试；`installToolchainIfNeeded` 调用与失败错误测试；CLI init 断言 schema/packVersion | 达成 |

## 里程碑

| 里程碑 | 状态 |
|---|---|
| M0 引擎 v1.0 对齐 | 已完成 |
| M1 内容提炼 | 已完成（骨架门规/分类目录/双语三件套/指针根块/三特性段/默认项目 skill，sha256 同步） |
| M1b docGates 工具链 | **已完成（2026-09-04）**：packages/toolchain（scaffold/base/text-link/doc-budgets/bilingual/extras/hooks + spec.json）；引擎组门控物化/组装 package.json/关闭移除；真实验证：临时项目 init→pnpm install→doc-sync exit 0，pre-commit 挂钩由 postinstall 写入且不覆盖外来配置 |
| M2 真实项目验证 | **已通过（2026-09-03）**：临时项目 init/status/audit 验证绿 |
| M3 历史宿主分发 | **历史事实（2026-09-05）**：`@maocili/dsh-vibe`、DSH bundle、Cordis plugin 与宿主打包覆盖曾存在，已由 standalone hard cut 移除 |
| M4 standalone hard cut | **已完成（2026-09-06）**：仅 `@maocili/vibe-init` CLI；无模块/plugin/bundle 表面；schema 2 与旧 namespace hard cut |
