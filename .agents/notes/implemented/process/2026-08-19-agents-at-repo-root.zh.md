# Agent Note: Agent 语料库位于仓库根

Status: implemented

[English](2026-08-19-agents-at-repo-root.md) | 中文

## 问题

模板内容收拢到 `.template/` 时，`.agents/` 语料库——Agent Notes 与技能——也被一并放进了可复制的模板。该语料库是容器自身的工作资产：本仓库的会话在这里撰写并维护 Agent Notes 与技能，而 `.template/` 是用户复制到新项目的产物。把语料库埋进 `.template/` 会让容器的工作资产与模板纠缠在一起，迫使所有门禁相对于模板根解析 `.agents/`，并让复制出的项目静默继承容器的决策记录。容器入口 `AGENTS.md` 也只把自身与 Git 元数据列为根级内容，与语料库的实际位置相矛盾。

## 决策

- 将 `.agents/` 从 `.template/.agents` 移到仓库根，与 `.template/` 同级。语料库属于容器级：Agent Notes 记录关于本容器及其模板的决策，技能示范 agent 在此使用的工作流。
- 模板门禁从脚本目录向上查找，直到找到 `.agents/` 目录（[repo-files.ts](../../../../.template/scripts/repo-files.ts)），因此同一套脚本在语料库位于仓库根（本容器）或项目根（复制了同级语料库的模板项目）时都能工作。
- 相对 Markdown 链接跨两个同级目录：模板文档引用 `../.agents/` 目标，语料库文件引用 `../.template/` 目标；`verify-md-links` 同时检查两棵目录树。
- 新建项目时把 `.template/` 与 `.agents/` 一起复制，使复制出的项目保留 agent 语料库，门禁仍能找到它。

## 备选方案

- **把语料库留在 `.template/` 内**——拒绝：容器自身的笔记与技能会随每个复制出的模板一起交付，且容器入口 `AGENTS.md` 会继续错误描述根布局。
- **拆分语料库（笔记留在 `.template/`，技能放根目录）**——拒绝：笔记与技能互相链接并共享同一生命周期；拆分将破坏目录树遍历，并迫使门禁使用两个根。

## 后果

- 仓库根现在包含 Git 元数据、入口 `AGENTS.md`、`.agents/` 语料库与 `.template/`。
- 模板门禁同时扫描两棵目录树；所有相对链接跨同级目录解析，`doc-sync` 保持绿色。
- [template-content-under-dot-template 笔记](2026-08-19-template-content-under-dot-template.md)的模板内容清单不再包含 `.agents/`；语料库的归属由本笔记记录。
