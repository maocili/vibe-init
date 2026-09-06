# packages — 内置规则包（内容唯一出处）

> 状态：**M1 内容提炼完成 + M1b docGates 工具链迁移完成（2026-09-04）**：notes 骨架门规、双语三件套
> （含有效 pairing record）、指针式根块、textLinkManagement / bilingualDocsDiscipline / docBudgets 特性段、
> `toolchain/` 门禁工具链（doc-gate + 双语 + lefthook）均已实写并同步 manifest sha256（`vibe-init hash`）；
> `skills/` 提供项目级技能，并默认物化。
> 本目录是本仓库内「纪律规则内容与工具链」的唯一版本化出处；vibe-init 只是**安装器/管理器**，不硬编码规则文本。

## 目录 → 物化目标映射

| 本目录文件 | 物化目标 | 语义 |
|---|---|---|
| `notes-skeleton/**` | `<project>/.agents/notes/**` | 项目笔记新鲜骨架（只结构，无历史内容；双语三件套为默认开箱形态；archived 六类目录 + 基线 manifest 随骨架就位，保证 verify-archived-agent-notes 开箱通过） |
| `docs/AGENTS.md` | `<project>/docs/AGENTS.md`（`docBudgets` 开启时） | 文档分层、篇幅目标与预算门禁规范 |
| `standing-orders-block.md` | `<project>/AGENTS.md`（marker 包裹追加） | 项目常设规则块（指针式，指向项目笔记骨架门规） |
| `skills/**` | `<project>/.agents/skills/<name>/`（默认全部） | 依赖包式项目技能副本（声明/升级管理；init 保守冲突、upgrade 同步受管文件并保留用户新增；SKILL.md 格式） |
| `toolchain/**` | `<project>/.vibe-init/toolchain`（docGates 伞） | doc-gate/双语/挂钩工具链：`spec.json` 声明组（scaffold/base/text-link/doc-budgets/bilingual/extras/hooks），按 feature 开关物化并组装 package.json |
| `features/**` | 依 `manifest.json.features` 开关物化 | 特性规则族（见下；默认按 REQUIREMENTS v1.0 + M1b 决策） |

> `upgrade` 受项目级 `.vibe-init/state.json` 驱动：规则 marker、生成文档、声明的工具链/技能和笔记骨架说明
> 文件属于可覆盖的受管内容；日期命名笔记、笔记 manifest、业务文档及未声明的用户文件属于用户资产。旧项目
> 无状态时仅按固定路径兼容识别，未知遗留只报告冲突、不自动删除；依赖变化在文件迁移后运行包管理器并在成功
> 后提交状态。
>
> 全局落点已退役删除；vibe-init 只做项目级初始化，**不触碰全局面**。
> docGates 由受管工具链提供，默认启用。

## 内置规则族（规划，含但不限于）

| 规则族 | 落点 | 默认 |
|---|---|---|
| agent note（何时写 / 格式指针 / 生命周期） | 根 `AGENTS.md` note 纪律块（指针式）+ `notes-skeleton/AGENTS.md`、`README*.md` | 开 |
| 文本链接管理（交叉引用 / 链接校验语义） | 根 `AGENTS.md`（`features/text-link-management.md`）；机械校验 = toolchain `verify-md-links` | 开（`textLinkManagement`） |
| 双语骨架（md/zh/i18n 三件套） | `notes-skeleton/README.{md,zh.md,i18n.yaml}` | 开（`bilingualPairing` = 三件套语义） |
| 双语纪律段（md/zh 配对同步纪律，重机制） | 根 `AGENTS.md`（`features/bilingual-docs.md`）；门禁+工具链+语料 = toolchain bilingual 组 | 关（独立 key `bilingualDocsDiscipline`） |
| doc 分层/预算轻量语义 | 根 `AGENTS.md`（`features/doc-budgets.md`）；机械预算 = toolchain `verify-doc-budgets` | 开（`docBudgets`） |
| docGates 工具链伞 | `<project>/.vibe-init/toolchain`（scaffold + note 门禁 + 挂钩） | 开（`docGates`） |
| docGates 扩展门禁（逐段折行/重门禁） | toolchain extras 组（verify-md-wrap/mermaid/skill-metadata） | 关（`docGatesExtras`） |

> 门禁：manifest `files[]`（规则）和 `skills[]`（每个技能资产）的 sha256 都由 manifest 声明（`hash` 刷新）；`toolchain/spec.json` 声明组与依赖、
> `status` 靠内容比对报 ok/drift/conflict，`upgrade` 按 state 幂等迁移、关闭特性只移除安全确认的受管副本。实现见实现设计 Agent Note；
> 引擎测试：仓库根 `pnpm test`（41 条，含升级所有权/状态迁移、docGates 物化/移除/audit/CLI 端到端）。
