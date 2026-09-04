# ACCEPTANCE — REQUIREMENTS v1.0 逐条追溯

> 每条需求/决策给出实现证据（测试名、命令、代码事实）。测试入口：`cd plugin && pnpm test`（17/17）。
> 范围权威：REQUIREMENTS-dsh-rules-plugin.md（v1.0 定案）。未实现项均已标注（DP-F/G 暂缓等）。

## 决策基线（§0 D1–D10）

| 决策 | 证据 | 状态 |
|---|---|---|
| D1 不做全局规则/全局面 | `plugin/lib/` 无任何 ~/.dsh / 用户技能根写入（grep 仅命中退役错误文案）；CLI 测试 install-global retired | 达成 |
| D2 每个项目显式初始化 | planProject 仅项目面；CLI init/upgrade/status/audit/hash/list-skills 全部 --project 作用域 | 达成 |
| D3 textLink/bilingualPairing 默认开 | rules-pack/manifest.json features + feature-gating 测试 | 达成 |
| D4 双语纪律段默认关 | manifest bilingualDocsDiscipline=false + gating 测试 + CLI 默认段测试 | 达成 |
| D5 技能 = 项目级副本（依赖包式） | skill 测试：复制/幂等/用户编辑冲突不覆盖；移除与自装识别待 DP-F/DP-G | 部分（DP-F/G） |
| D6/D7 本文档定案、取代 DESIGN §1/§2 | 文档权威关系（AGENTS/REQUIREMENTS/DESIGN 头部） | 达成 |
| D8 根规则块指针式（短块指骨架） | standing-orders-block.md 内容形态 + e2e 物化后根 AGENTS.md 指针文案 | 达成 |
| D9 双语纪律段独立 key | manifest feature-bilingual-docs 行 feature=bilingualDocsDiscipline | 达成 |
| D10 docBudgets 默认开 | manifest feature-doc-budgets 行 + gating 测试 + CLI 默认段测试 | 达成 |

## 行为需求（§2 R1–R10）

| 需求 | 证据 | 状态 |
|---|---|---|
| R1 项目显式初始化 | cli.test init 幂等 + e2e（rules.test） | 达成 |
| R2 绝不触碰全局面 | status JSON 无 global 键（cli.test）；lib 无全局写入 | 达成 |
| R3 技能依赖包式项目副本 | skill 测试（创建/幂等/conflict）；移除与自装识别待 DP-F/DP-G | 部分 |
| R4 只拿受管内容 | polluted 测试：旧 note/.template/dsh-* 只 flag 不物化；未知顶层 info | 达成 |
| R5 内容单一出处 + sha256 | loadPack 校验 + hashPack 测试 + upgrade-isolation 测试（notes 字节不变） | 达成 |
| R6 绝不覆盖用户内容 | conflict 测试：骨架文件/用户根段外编辑/技能副本均 conflict 保留 | 达成 |
| R7 幂等 | 引擎与 CLI 双跑 nothing-to-do；多段字节稳定测试 | 达成 |
| R8 状态可观测 | status/audit JSON：逐项 action、无 global、pack-drift 数组为空（cli.test） | 达成 |
| R9 可安全演进（upgrade 隔离） | upgrade-isolation 测试：仅版本变更段更新、笔记字节不变 | 达成 |
| R10 显式触发、挂载无副作用 | apply() 测试（挂载仅就绪日志）+ engine apply 无物化 | 达成 |

## 里程碑

| 里程碑 | 状态 |
|---|---|
| M0 引擎 v1.0 对齐 | 已完成（提交 ee9dd7d…e4c241a） |
| M1 内容提炼 | 已完成（骨架门规/双语三件套/指针根块/三特性段，sha256 同步）；skills-optional 待 DP-F |
| M2 真实挂载与验证 | **已通过（2026-09-03）**：insert 已写入（用户同意）；宿主重启日志出现 mounted；真实项目 /Users/xuxifeng/Work/dsh-rules-demo init/status/audit 验证绿 |
| M3 可分发 | 未启动（用户决策） |
