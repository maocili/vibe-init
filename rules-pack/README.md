# rules-pack — 内置规则包（内容唯一出处）

> 状态：**内容提炼进行中（M1，2026-09-03）**：notes 骨架门规、双语三件套、指针式根块、
> textLinkManagement / bilingualDocsDiscipline 特性段已实写并同步 manifest sha256（`dsh-rules hash`）；
> `skills-optional/` 技能内容待提炼（DP-F 暂缓）。
> 本目录是本仓库内「纪律规则内容」的唯一版本化出处；dsh-rules 插件只是**安装器/管理器**，不硬编码
> 规则文本（依据 `DESIGN-dsh-rules-plugin.md` §3）。语料唯一出处：`/Users/xuxifeng/Work/vibe-coding-templates`。

## 目录 → 物化目标映射

| 本目录文件 | 物化目标 | 语义 |
|---|---|---|
| `notes-skeleton/**` | `<project>/.agents/notes/**` | 项目笔记新鲜骨架（只结构，无历史内容；双语三件套为默认开箱形态） |
| `standing-orders-block.md` | `<project>/AGENTS.md`（marker 包裹追加） | 项目常设规则块（指针式，指向项目笔记骨架门规） |
| `skills-optional/**` | `<project>/.agents/skills/<name>/`（`init --skill` 挑选） | 依赖包式项目技能副本（声明/升级管理；用户自装不覆盖；SKILL.md 格式） |
| `features/**` | 依 `manifest.json.features` 开关物化 | 特性规则族（见下；默认按 REQUIREMENTS v1.0） |

> v1.0 修订：`global/`（→ `~/.dsh/AGENTS.md`）全局落点已退役删除——插件只做项目级初始化，
> **不触碰全局面**（REQUIREMENTS §0 D1/D2）。

## 内置规则族（规划，含但不限于）

| 规则族 | 落点 | 默认 |
|---|---|---|
| 规则族 | 落点 | 默认（v1.0） |
|---|---|---|
| agent note（何时写 / 格式指针 / 生命周期） | 根 `AGENTS.md` note 纪律块（指针式）+ `notes-skeleton/AGENTS.md`、`README*.md` | 开 |
| 文本链接管理（交叉引用 / 链接校验语义） | 根 `AGENTS.md`（`features/text-link-management.md`） | 开（`textLinkManagement`） |
| 双语骨架（md/zh/i18n 三件套） | `notes-skeleton/README.{md,zh.md,i18n.yaml}` | 开（`bilingualPairing` = 三件套语义） |
| 双语纪律段（md/zh 配对同步纪律，重机制） | 根 `AGENTS.md`（`features/bilingual-docs.md`） | 关（独立 key `bilingualDocsDiscipline`） |
| doc 分层/预算轻量语义 | 根 `AGENTS.md`（`features/doc-budgets.md`） | 开（`docBudgets`） |

> 门禁：文件清单与 `sha256` 由 `manifest.json` 声明；`status` 靠摘要报漂移，`upgrade`
> 只改规则包版本变化的文件。实现期按 `DESIGN…` §4/§5 落地；容器级评审门禁（doc-sync
> 语义子集）待定。
