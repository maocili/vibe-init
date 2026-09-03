# Agent Note: 模板内容收拢到 .template/ 并保留根目录入口

Status: implemented

[English](2026-08-19-template-content-under-dot-template.md) | 中文

## 问题

仓库根目录把两种职责混在一起：它既是 Git 仓库根，又是模板内容根。vibe-coding 模板的每一个文件——常设规则、文档、笔记、技能、脚本与项目配置——都直接放在顶层，因此根目录无法在不与模板门禁纠缠的情况下容纳其他内容（第二个模板、容器级文档或不相关内容）。模板自身的脚本用 `resolve(import.meta.dirname, '..')` 解析仓库根，这使目录树被绑定在固定布局上，让人以为搬移成本很高。与此同时，`verify-archived-agent-notes` 从硬编码的仓库相对路径读取封存清单基线路径，当受跟踪内容位于 Git 根的子目录时，该路径会静默失效。

## 决策

- 将模板内容移入仓库的 `.template/` 子目录：`AGENTS.md`、双语 `README` 三件套、`docs/`、`scripts/`、`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`tsconfig.json` 与 `tsconfig.host.json`。`.agents/` 语料库是位于仓库根、与 `.template/` 同级的容器级资产，不属于 `.template/` 的一部分（见 [agents-at-repo-root 笔记](2026-08-19-agents-at-repo-root.md)）。
- Git 根保留在父目录：`.git/`、`.gitattributes` 与 `.gitignore` 留在仓库根，使仓库继续作为可容纳模板、`.agents/` 语料库及其他内容的容器。除该同级语料库外，模板在 `.template/` 内保持自包含：脚本通过 `import.meta.dirname` 解析根，门禁在目录内以 `pnpm` 运行，配对记录基于内容哈希、不受搬移影响，门禁会从脚本目录向上查找 `.agents/`。
- 新增根目录 `AGENTS.md` 入口，说明布局并提示会话在 `.template/` 内打开以加载完整规则。根目录文件仅为容器级，不参与模板门禁范围。
- 让 `scripts/verify-archived-agent-notes.ts` 从 Git 根（`git rev-parse --show-toplevel`）推导封存清单路径，而不是硬编码 `.agents/notes/archived/manifest.json`，使基线对比在内容位于 Git 根或子目录两种布局下都正确。

## 备选方案

- **把 `.git` 移入子目录（内容与仓库根重合）**——拒绝：仓库是模板的容器，迁移 Git 根会让父目录失去版本控制，并迫使未来的每个同级内容各自携带仓库。
- **保持模板在根目录，只增加容器 README**——拒绝：没有分离关注点；根目录文件仍会与模板门禁纠缠，而且用户要求把这些文件规划到一个文件夹下。
- **非隐藏目录名（`template/`）**——拒绝，改为用户选择的 `.template/`；隐藏点目录让容器根保持整洁，同时门禁与 DSH 文件 glob 都能匹配显式点前缀路径，已实测验证。
- **保持 `verify-archived-agent-notes` 硬编码并记录该假设**——拒绝：一旦内容位于 Git 根之下，门禁会失败或静默比对错误路径；从 `git rev-parse --show-toplevel` 推导只多一个子进程开销，且在两种布局下都保持正确。

## 后果

- 仓库根现在保留 Git 元数据、入口 `AGENTS.md`、`.agents/` 语料库与 `.template/`；`.pnpm-store/` 作为共享 pnpm store 缓存留在根目录并保持被忽略。
- 会话必须在 `.template/` 内打开才能把完整模板规则作为基线加载；在根目录打开的会话只加载入口文档。会话触碰 `.template/` 下文件时，嵌套指令发现机制仍会注入 `.template/AGENTS.md`。
- `pnpm run doc-sync`、`pnpm test` 与 `pnpm build` 现在在 `.template/` 内运行；由于内容哈希与模板内部的仓库相对路径被 `git mv` 完整保留，所有门禁不变地通过。
- Git 历史以重命名形式保留，配对记录无需重录，因为 blob 哈希基于内容。
- 未来的同级内容可以放在根目录 `.template/` 旁，而不会触及模板门禁。
