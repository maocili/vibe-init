# vibe-coding-templates

[English](README.md) | 中文

这是一个用于 vibe coding 的精简模板仓库，从 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 项目中提炼而来：保留其工作纪律，去除其产品历史。把它作为新项目的起点骨架——复制整个目录，`git init`，`pnpm install`，然后开始写作。

## 目录结构

- `AGENTS.md` — 常设命令；任何 agent 会话的入口。
- `docs/` — 文档标准（`AGENTS.md`）、双语配对契约（`i18n/`）与事故复盘规则（`postmortem/`）。
- `.agents/notes/` — Agent Notes：带生命周期与分类规则的持久决策记录。
- `.agents/skills/` — 可复用的 skill 示例；按它们的格式编写你自己的 skill。
- `scripts/` — `pnpm run doc-sync` 背后的文档与笔记门禁。

## 快速开始

1. 将本模板（`AGENTS.md`、`docs/`、`scripts/` 等）连同同级的 `.agents/` 语料库一起复制到你的新项目目录。
2. 运行 `git init` 与 `pnpm install`。
3. 运行一次 `pnpm run doc-sync`，确认基线为绿色。
4. 用你项目的介绍替换本 README 的内容，并保持双语配对。

## 门禁

- `pnpm run doc-sync` — 链接、段落换行、字数预算、笔记格式、归档完整性、配对一致性、skill 元数据、`ts` 代码块。
- `pnpm test` — 门禁的 vitest 规格测试。
- `pnpm run verify-translation-pairing --write <pair>` — 编辑配对任一侧后重新记录配对。

规则与理由见各链接文档；每条事实只保留在其所属位置。
