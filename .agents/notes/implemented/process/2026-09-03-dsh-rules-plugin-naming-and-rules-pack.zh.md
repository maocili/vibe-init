# Agent Note: dsh-rules 插件命名与 rules-pack 布局

Status: implemented

[English](2026-09-03-dsh-rules-plugin-naming-and-rules-pack.md) | 中文

## 问题

dsh-rules 插件仓库按设计草案搭建的骨架沿用了草案时期的命名：DESIGN 文档及其命令表使用 `discipline <action>` / `dsh-discipline`，规则包目录叫 `discipline-pack/`。落地后的仓库名（`dsh-rules`）因此与自身文档不一致，入口 `AGENTS.md` 只能把定案推给 DESIGN §10 待决问题 1，本仓库为容纳规则包与插件源码而扩展的根布局也还没有记录进本仓库的 Agent Notes。

## 决策

- 插件名与命令前缀定案为 **dsh-rules**：CLI 动作以 `dsh-rules init|status|upgrade|audit|install-global|hash|list-skills` 形式运行，受管段使用 `<!-- dsh-rules:<entryId>:start/end -->` marker，Cordis insert id 为 `dsh-rules`。草案名 `dsh-discipline` / `discipline-*` 弃用，只作为 DESIGN 中的命名沿革保留。
- 规则包目录由 `discipline-pack/` 更名 **`rules-pack/`**——仍是仓库根的唯一版本化内容源；插件默认规则包路径、CLI 帮助、manifest 路径与入口文档同步跟随。
- DESIGN 文件随仓库更名（`DESIGN-dsh-rules-plugin.md`，H1 同步）；DESIGN §10 待决问题 1 记为已定案（2026-09-03）。
- 仓库根布局现为：入口 `AGENTS.md`、`README.md`、`DESIGN-dsh-rules-plugin.md`、`rules-pack/`、`plugin/`、`.template/` 与 `.agents/`——是容器 [agents-at-repo-root](2026-08-19-agents-at-repo-root.zh.md) 决策的扩展。本仓库 `.agents/notes/` 承载本项目自己的开发记录；`rules-pack/` 占位内容提炼自原始 `../vibe-coding-templates` 仓库。

## 备选方案

- **沿用草案名**（把仓库/插件改回 `dsh-discipline` / `discipline-pack`）：否决。仓库名、包名与 CLI 入口已是 `dsh-rules`，且 dsh-* 技能命名风格下 `dsh-rules` 前缀更自然。
- **只改文档不改目录**（磁盘上保留 `discipline-pack/`，行文用 `rules-pack/`）：否决。目录是插件默认规则包路径与 manifest 所在处；文档与默认路径必须同源，否则入口描述再次漂移。
- **裸命令名**（`init` / `status` 不带前缀）：否决。无前缀动词在会话里难以与其它工具区分归属；`dsh-rules` 前缀让 CLI、marker 与未来会话内工具都有可发现的名字空间。

## 后果

入口文档、DESIGN 工作稿、插件代码与规则包目录现在统一到一个名字与一个包位置。此前物化只发生在本仓库自己的 scratch 演练里，没有外部消费者需要迁移；后续 `[实现期]` 规则内容在 `rules-pack/` 下撰写。

