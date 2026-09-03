# rules-pack — 内置规则包（内容唯一出处）

> 状态：骨架（占位文件待填充）。本目录是本仓库内「纪律规则内容」的唯一版本化出处；
> dsh-rules 插件只是**安装器/管理器**，不硬编码规则文本（依据
> `DESIGN-dsh-rules-plugin.md` §3「为什么不把规则内容硬编码进插件」）。
> 规则内容实现期从 `/Users/xuxifeng/Work/vibe-coding-templates`（及 `.template/`、`.agents/`）提炼。

## 目录 → 物化目标映射

| 本目录文件 | 物化目标 | 语义 |
|---|---|---|
| `global/AGENTS.md` | `~/.dsh/AGENTS.md` | 全局常设规则（每次会话基线注入） |
| `notes-skeleton/**` | `<project>/.agents/notes/**` | 项目笔记新鲜骨架（只结构，无历史内容） |
| `standing-orders-block.md` | `<project>/AGENTS.md`（marker 包裹追加） | 项目常设规则块 |
| `skills-optional/**` | 用户级技能根（由用户挑选） | 可选通用技能（SKILL.md 格式） |
| `features/**` | 依 `manifest.json.features` 开关物化 | 特性规则族（默认关闭） |

## 内置规则族（规划，含但不限于）

| 规则族 | 落点 | 默认 |
|---|---|---|
| agent note（何时写 / 格式指针 / 生命周期） | `global/AGENTS.md` + `notes-skeleton/AGENTS.md`、`README*.md` | 开 |
| 文本链接管理（交叉引用 / 链接校验语义） | `features/text-link-management.md` | 关（`textLinkManagement`） |
| 双语文档（md/zh 配对 + i18n） | `features/bilingual-docs.md` + `notes-skeleton/README.{md,zh.md,i18n.yaml}` 三件套 | 关（`bilingualPairing`） |

> 门禁：文件清单与 `sha256` 由 `manifest.json` 声明；`status` 靠摘要报漂移，`upgrade`
> 只改规则包版本变化的文件。实现期按 `DESIGN…` §4/§5 落地；容器级评审门禁（doc-sync
> 语义子集）待定。
