# rules-pack — 内置规则包（内容唯一出处）

> 状态：**M1 内容提炼完成 + M1b docGates 工具链迁移完成（2026-09-04）**：notes 骨架门规、双语三件套
> （含有效 pairing record）、指针式根块、textLinkManagement / bilingualDocsDiscipline / docBudgets 特性段、
> `toolchain/` 门禁工具链（doc-gate + 双语 + lefthook）均已实写并同步 manifest sha256（`dsh-rules hash`）；
> `skills-optional/` 技能内容待提炼（DP-F 暂缓）。
> 本目录是本仓库内「纪律规则内容与工具链」的唯一版本化出处；dsh-rules 插件只是**安装器/管理器**，不硬编码
> 规则文本按 [`docs/REQUIREMENTS-dsh-rules-plugin.md`](../docs/REQUIREMENTS-dsh-rules-plugin.md) 的范围契约维护；实现取舍见
> [Agent Note：dsh-rules 实现设计](../.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md)。语料唯一出处：`/Users/xuxifeng/Work/vibe-coding-templates`。

## 目录 → 物化目标映射

| 本目录文件 | 物化目标 | 语义 |
|---|---|---|
| `notes-skeleton/**` | `<project>/.agents/notes/**` | 项目笔记新鲜骨架（只结构，无历史内容；双语三件套为默认开箱形态；archived 六类目录 + 基线 manifest 随骨架就位，保证 verify-archived-agent-notes 开箱通过） |
| `standing-orders-block.md` | `<project>/AGENTS.md`（marker 包裹追加） | 项目常设规则块（指针式，指向项目笔记骨架门规） |
| `skills-optional/**` | `<project>/.agents/skills/<name>/`（`init --skill` 挑选） | 依赖包式项目技能副本（声明/升级管理；用户自装不覆盖；SKILL.md 格式） |
| `toolchain/**` | `<project>/.dsh-rules/toolchain`（docGates 伞） | doc-gate/双语/挂钩工具链：`spec.json` 声明组（scaffold/base/text-link/doc-budgets/bilingual/extras/hooks），按 feature 开关物化并组装 package.json |
| `features/**` | 依 `manifest.json.features` 开关物化 | 特性规则族（见下；默认按 REQUIREMENTS v1.0 + M1b 决策） |

> v1.0 修订：`global/`（→ `~/.dsh/AGENTS.md`）全局落点已退役删除——插件只做项目级初始化，
> **不触碰全局面**（REQUIREMENTS §0 D1/D2）。
> M1b（2026-09-04 用户拍板）：门禁运行时由「不做移植」改为 **docGates 受管工具链**（默认开），
> 见 REQUIREMENTS §0 决策行与实现设计 Agent Note。

## 内置规则族（规划，含但不限于）

| 规则族 | 落点 | 默认（v1.0 + M1b） |
|---|---|---|
| agent note（何时写 / 格式指针 / 生命周期） | 根 `AGENTS.md` note 纪律块（指针式）+ `notes-skeleton/AGENTS.md`、`README*.md` | 开 |
| 文本链接管理（交叉引用 / 链接校验语义） | 根 `AGENTS.md`（`features/text-link-management.md`）；机械校验 = toolchain `verify-md-links` | 开（`textLinkManagement`） |
| 双语骨架（md/zh/i18n 三件套） | `notes-skeleton/README.{md,zh.md,i18n.yaml}` | 开（`bilingualPairing` = 三件套语义） |
| 双语纪律段（md/zh 配对同步纪律，重机制） | 根 `AGENTS.md`（`features/bilingual-docs.md`）；门禁+工具链+语料 = toolchain bilingual 组 | 关（独立 key `bilingualDocsDiscipline`） |
| doc 分层/预算轻量语义 | 根 `AGENTS.md`（`features/doc-budgets.md`）；机械预算 = toolchain `verify-doc-budgets` | 开（`docBudgets`） |
| docGates 工具链伞 | `<project>/.dsh-rules/toolchain`（scaffold + note 门禁 + 挂钩） | 开（`docGates`） |
| docGates 扩展门禁（逐段折行/重门禁） | toolchain extras 组（verify-md-wrap/mermaid/skill-metadata） | 关（`docGatesExtras`） |

> 门禁：manifest `files[]` 的 sha256 由 manifest 声明（`hash` 刷新）；`toolchain/spec.json` 声明组与依赖、
> `status` 靠内容比对报 ok/drift/conflict，`upgrade` 幂等迁移、关闭特性移除受管副本。实现见实现设计 Agent Note；
> 引擎测试：仓库根 `pnpm test`（26 条，含 docGates 物化/移除/audit/CLI 端到端）。
