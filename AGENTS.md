# AGENTS.md — dsh-rules 仓库入口

本仓库是 **dsh-rules** DSH 插件的开发仓库：把「复制 vibe-coding-templates 容器进每个项目」的
消费方式，改成「**每个项目由插件初始化出受管面**」（项目根规则块 + 笔记骨架 + 选定技能副本）；
插件是项目级初始化器/依赖管理器，**不触碰用户全局面**（~/.dsh/AGENTS.md、用户技能根）。
规则文本的唯一版本化出处是本仓库的 `rules-pack/`，`plugin/` 只做项目级安装/管理。
范围/目标口径：`REQUIREMENTS-dsh-rules-plugin.md`（**定案 v1.0，取代 DESIGN §1/§2**）；实现方案：`DESIGN-dsh-rules-plugin.md`。

> EN TL;DR: **dsh-rules** is the dev repo for a per-project initializer plugin. It replaces
> copy-the-container with a managed surface in each project: a marker-wrapped rule block in the root
> `AGENTS.md` (note discipline + text-link management by default), a fresh notes skeleton under
> `.agents/notes/` (bilingual-ready by default), and declared skill copies under `.agents/skills/`
> managed like dependency packages. It never touches the user-global plane (`~/.dsh/AGENTS.md`,
> user skill roots). The versioned rule pack under [`rules-pack/`](rules-pack/README.md) is the
> single content source; the plugin under [`plugin/`](plugin/README.md) only installs/manages per
> project. Scope authority: `REQUIREMENTS-dsh-rules-plugin.md` (v1.0 + M1b decisions D11/D12 —
> supersedes DESIGN §1/§2); rule-pack content (skeleton gates, bilingual trio, pointer block,
> feature sections, and the docGates toolchain under `toolchain/`) is distilled and
> sha256-synced; `skills-optional/` awaits DP-F.

## 入口文档

- [`README.md`](README.md) — 总览、目录结构与当前状态（M0–M3 实现顺序）。
- [`DESIGN-dsh-rules-plugin.md`](DESIGN-dsh-rules-plugin.md) — 设计方案工作稿；实现方案细节的
  决策权威（分层归属、manifest 格式、命令面、权限模型、里程碑）。命名已定案（DESIGN §10 问题 1）：
  插件名/命令前缀 `dsh-rules`、规则包目录 `rules-pack/`（草案曾用 dsh-discipline）。
  **范围/目标口径以 REQUIREMENTS…（v1.0 定案）为准（取代 DESIGN 旧 §1/§2）；DESIGN 已按 v1.0 对齐修订（2026-09-03，全局面设计移除）。**
- [`REQUIREMENTS-dsh-rules-plugin.md`](REQUIREMENTS-dsh-rules-plugin.md) — 需求与目标（**定案 v1.0**；据用户决策：**项目级初始化器、不碰全局面**；定案后**取代 DESIGN §1/§2 作为范围口径**；决策基线 D1–D7 见文档 §0）

## 目录结构

- [`rules-pack/`](rules-pack/README.md) — 内置规则包：**唯一版本化内容源**。
  `manifest.json` 声明文件清单与 `sha256`（含 features 开关）；子目录映射物化目标
  （`notes-skeleton/` → 项目 `.agents/notes/`，`standing-orders-block.md` → 项目根 `AGENTS.md`
  的 marker 段，`skills-optional/` → 项目 `.agents/skills/`，`features/`，
  `toolchain/` → 项目 `.dsh-rules/toolchain`，docGates 伞 + spec.json 组）。`global/`（→ ~/.dsh）
  已按 v1.0 退役删除。内容已实写并同步 sha256（M1 内容 + **M1b（2026-09-04）toolchain docGates 工具链**：
  doc-gate/双语/挂钩，REQUIREMENTS D11/D12）；skills-optional 技能内容待提炼（DP-F）。
- [`plugin/`](plugin/README.md) — dsh-rules 插件源码（host 层安装器/管理器）：
  `dsh-rules.mjs` + `cordis.patch.sample.yml`（挂载样例）。
- `.template/` + `.agents/` — 从源容器（vibe-coding-templates）带入的子树：`.agents/notes/` 是
  **本项目自己的开发记录**（沿用容器笔记格式与门规，新决策以 Agent Note 记录）；
  `.template/` 承载 doc 门禁工具链与双语配对样例，`.agents/skills/` 为技能参考。
  `rules-pack/` 占位内容的语料唯一出处是外部仓库 `../vibe-coding-templates/`。
  触碰这两棵子树时，其嵌套 `AGENTS.md` 规则随之生效。

## 会话规则

- 开工前先读「入口文档」；**范围与目标以 `REQUIREMENTS…`（v1.0 定案，取代 DESIGN §1/§2）为准**，
  占位内容与实现方案细节以 `README.md`、`DESIGN…` 为准（DESIGN 已按 v1.0 对齐修订，见 REQUIREMENTS §6）。
- **规则内容一律写入 `rules-pack/`**（DESIGN §3：不把规则内容硬编码进插件）；改 `plugin/`
  只动安装/管理逻辑。
- 修改 `rules-pack/` 文件时保持 `manifest.json` 的 files 清单与 `sha256` 同步（`status`/
  `upgrade` 依赖内容寻址）；改动 `toolchain/**` 分组/依赖时同步 `spec.json`，并跑
  `cd plugin && pnpm test`（26 条含 docGates 物化/移除回归）。
- 修改 `.template/` 内容后，提交前在 `.template/` 内跑 `pnpm run doc-sync`。
- 根级文件（本文件、`README.md`、`DESIGN…`、`rules-pack/`、`plugin/`）为容器级，不在
  `.template/` 门禁范围内；`rules-pack/` 自己的评审门禁（doc-sync 语义子集）实现期待定。