# AGENTS.md — dsh-rules 仓库入口

本仓库是 **dsh-rules** DSH 插件的开发仓库：把「复制 vibe-coding-templates 容器进每个项目」的
消费方式，改成「装一次、处处生效」的运行时能力（设计依据 `DESIGN-dsh-rules-plugin.md`）。
插件把纪律安装到用户全局面，每个项目只得到属于自己的新鲜笔记骨架；规则文本的唯一版本化出处是
本仓库的 `rules-pack/`，`plugin/` 只做安装/管理，不硬编码规则内容。

> EN TL;DR: **dsh-rules** is the dev repo for a DSH plugin that installs discipline as a runtime
> capability instead of a copy: standing orders + generic skills land once in the user-global plane
> (`~/.dsh/AGENTS.md`, user skill roots), and each project receives only a fresh notes skeleton
> (`.agents/notes/` + a marker-wrapped standing-orders block in its root `AGENTS.md`). The versioned
> rule pack under [`rules-pack/`](rules-pack/README.md) is the single content source; the
> plugin under [`plugin/`](plugin/README.md) is only the installer/manager. Rule-pack files are
> placeholders marked `[实现期]` until distilled from the source container corpus.

## 入口文档

- [`README.md`](README.md) — 总览、目录结构与当前状态（M0–M3 实现顺序）。
- [`DESIGN-dsh-rules-plugin.md`](DESIGN-dsh-rules-plugin.md) — 设计方案工作稿；实现前它是
  决策权威（分层归属模型、manifest 格式、命令面、权限模型、里程碑）。命名已定案（DESIGN
  §10 问题 1）：插件名/命令前缀 `dsh-rules`、规则包目录 `rules-pack/`（草案曾用 dsh-discipline）。

## 目录结构

- [`rules-pack/`](rules-pack/README.md) — 内置规则包：**唯一版本化内容源**。
  `manifest.json` 声明文件清单与 `sha256`（含 features 开关）；子目录映射物化目标
  （`global/` → `~/.dsh/AGENTS.md`，`notes-skeleton/` → 项目 `.agents/notes/`，
  `standing-orders-block.md` → 项目根 `AGENTS.md` 的 marker 段，`skills-optional/`、
  `features/`）。当前为骨架，占位文件标注 `[实现期]`，待从源容器语料提炼。
- [`plugin/`](plugin/README.md) — dsh-rules 插件源码（host 层安装器/管理器）：
  `dsh-rules.mjs` + `cordis.patch.sample.yml`（挂载样例）。
- `.template/` + `.agents/` — 从源容器（vibe-coding-templates）带入的子树：`.agents/notes/` 是
  **本项目自己的开发记录**（沿用容器笔记格式与门规，新决策以 Agent Note 记录）；
  `.template/` 承载 doc 门禁工具链与双语配对样例，`.agents/skills/` 为技能参考。
  `rules-pack/` 占位内容的语料唯一出处是外部仓库 `../vibe-coding-templates/`。
  触碰这两棵子树时，其嵌套 `AGENTS.md` 规则随之生效。

## 会话规则

- 开工前先读「入口文档」；占位内容与里程碑以 `README.md`、`DESIGN…` 为准。
- **规则内容一律写入 `rules-pack/`**（DESIGN §3：不把规则内容硬编码进插件）；改 `plugin/`
  只动安装/管理逻辑。
- 修改 `rules-pack/` 文件时保持 `manifest.json` 的 files 清单与 `sha256` 同步（`status`/
  `upgrade` 依赖内容寻址）。
- 修改 `.template/` 内容后，提交前在 `.template/` 内跑 `pnpm run doc-sync`。
- 根级文件（本文件、`README.md`、`DESIGN…`、`rules-pack/`、`plugin/`）为容器级，不在
  `.template/` 门禁范围内；`rules-pack/` 自己的评审门禁（doc-sync 语义子集）实现期待定。
