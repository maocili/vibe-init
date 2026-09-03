# Agent Note: 归档 kind 目录占位文件与全新检出基线容忍

Status: implemented

[English](2026-08-14-archived-kind-placeholders-and-fresh-baseline.md) | 中文

## 问题

Git 不跟踪空目录，而 [verify-archived-agent-notes](../../../../.template/scripts/verify-archived-agent-notes.ts) 要求 [archived/](../../archived/AGENTS.md) 下六个 kind 目录（`feature/`、`bug-fix/`、`simplification/`、`architecture/`、`process/`、`testing/`）全部存在。因此本模板的全新 clone 会以 "required kind directory is missing" 对每个 kind 报错。同一门禁还从 Git `HEAD` 读取封存清单基线，所以尚无提交的检出——或根本不是 Git 仓库——会以晦涩的 `fatal: Not a valid object name HEAD^{commit}` / `not a git repository` 失败，尽管此时根本没有已封存的工件可比较。

## 决策

- 在每个归档 kind 目录内置一个 `.gitkeep` 占位文件，使空目录树在 clone 与复制后依然存在，并让门禁在枚举 kind 目录工件时跳过名为 `.gitkeep` 的文件。
- 当基线引用为默认的 `HEAD` 且 Git 无法提供它（尚无提交，或不是 Git 仓库）时，将基线视为空（`{version: 1, files: {}}`）而不是报错：Git 中没有任何已封存内容时，空封存集正是正确基线，而模板自身的快速开始流程会在首次提交之前运行 `doc-sync`。显式设置的 `DSH_ARCHIVE_BASE_REF` 保持失败即响，因为那是 CI 契约，而非全新检出的状态。

## 曾考虑的替代方案

- **clone 后手工创建 kind 目录**：否决。失败只在门禁运行时才显现，而模板应当以它交付时的状态通过自身的门禁。
- **每个 kind 目录放一个 `README.md` 占位**：否决。Markdown 门禁会扫描它，而 [archived/AGENTS.md](../../archived/AGENTS.md) 已经说明了归档所需的全部规则；`.gitkeep` 才是约定俗成的空目录占位。
- **要求先完成首次提交再运行 `doc-sync`**：否决。零已封存工件时空基线是正确的，而且为了迁就门禁而调整流程顺序，会把真实的全新 clone 失败掩盖在误导性的报错之下。

## 后果

- 全新 clone 能以六个 kind、零冻结工件通过 `verify-archived-agent-notes`；首个归档三件套仍照常以 `--write` 封存。
- 只要基线存在，封存清单扩展检查依然保护每个已封存工件；被容忍的只有默认 `HEAD` 基线不可用这一种情况。
- 两处行为扩展被限定在门禁中小而明确的命名分支（`.gitkeep` 跳过与默认基线回退），并在此记录。
