# AGENTS.md — vibe-init 仓库入口

本仓库是 **vibe-init** 独立 CLI 初始化器：从 `packages/` 读取版本化规则包，为每个项目物化受管面（项目根
`AGENTS.md` 的 marker 规则段、`.agents/notes/` 笔记骨架、选定技能副本和 `.vibe-init/toolchain/` 工具链），
不触碰用户全局配置或技能目录。范围/目标口径：[`docs/REQUIREMENTS-vibe-init.md`](docs/REQUIREMENTS-vibe-init.md)；
实现方案与取舍记录在
[实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md)。

> EN TL;DR: this repository publishes **vibe-init** as the standalone `@maocili/vibe-init` CLI initializer. It
> materializes a project-local managed surface from `packages/`: marker-wrapped rules in the project root
> `AGENTS.md`, a bilingual-ready `.agents/notes/` skeleton, declared `.agents/skills/` copies, and the
> `.vibe-init/toolchain/` documentation gates. The CLI does not expose a module or plugin surface, bundle metadata,
> host mount, or user-global installation plane. Scope authority is
> [`docs/REQUIREMENTS-vibe-init.md`](docs/REQUIREMENTS-vibe-init.md); implementation rationale lives in the linked
> Agent Notes.

## 入口文档

- [`README.md`](README.md) — 仓库总览、CLI 安装、物化语义和命令面。
- [`docs/README.md`](docs/README.md) — 项目文档索引与总览。
- [`docs/REQUIREMENTS-vibe-init.md`](docs/REQUIREMENTS-vibe-init.md) — 需求与目标（定案 v1.0，范围口径）。
- [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md) — 验收追溯矩阵。
- [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md)、
  [实现历史 Agent Note](.agents/notes/implemented/process/2026-09-04-vibe-init-implementation-history.md)、
  [Upgrade 所有权迁移 Note](.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) — 实现设计与决策级历史。
- [`packages/README.md`](packages/README.md) — 内置规则包内容映射与门禁说明。

## 目录结构

```
vibe-init/
├── AGENTS.md                   # 本文件（仓库入口）
├── README.md                   # CLI 说明（安装、命令面、物化语义）
├── bin/vibe-init.mjs           # CLI 入口（init/upgrade/status/audit/hash/list-skills）
├── lib/                        # engine / pack / cli / diff
├── test/                       # 自动化测试（node:test）
├── package.json                # @maocili/vibe-init；vibe-init bin
├── packages/                   # 内置规则包 —— 唯一版本化内容源（manifest.json + sha256）
│   ├── notes-skeleton/         #   → 项目 .agents/notes/ 骨架
│   ├── standing-orders-block.md#   → 项目根 AGENTS.md 的 marker 段
│   ├── skills/                 #   → 项目 .agents/skills/ 副本
│   ├── features/               #   特性规则段
│   └── toolchain/              #   docGates 工具链
└── docs/                       # 项目文档
    ├── README.md               #   总览与文档索引
    ├── AGENTS.md               #   文档分层、篇幅目标与预算门禁规范
    ├── REQUIREMENTS-vibe-init.md  # 需求与目标
    ├── ACCEPTANCE.md           #   需求-验证追溯矩阵
    └── CHANGELOG.md            #   实现历史兼容指针页
```

- 内容源与初始化器同仓：`packages/manifest.json` 声明文件清单、特性、工具链和 `sha256`；子目录映射物化目标见
  [`packages/README.md`](packages/README.md)。
- 仓库自身 `.agents/notes/` 仅保留开发记录；消费者的项目面由 CLI 在目标项目中创建。

## 会话规则

- 开工前先读「入口文档」；**范围与目标以 `docs/REQUIREMENTS…`（v1.0 定案）为准**，实现方案与取舍以
  [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md) 为准。
- **规则内容一律写入 `packages/`**（不把规则内容硬编码进 CLI）；改仓库 CLI 源码
  （`bin/`、`lib/`、`test/`、`package.json`）只动安装/管理逻辑。
- 修改 `packages/` 文件时保持 `manifest.json` 的 files 清单与 `sha256` 同步
  （`status`/`upgrade` 依赖内容寻址；刷新用 `node bin/vibe-init.mjs hash --pack packages` 或
  `$VIBE_INIT_PACK`）；改动 `toolchain/**` 分组/依赖时同步 `spec.json`，并跑仓库根 `pnpm test`。
- 修改 `docs/` 或根 README 时留意跨目录相对链接（`docs/**` 内互链、指向根 `AGENTS.md`/`README.md` 需 `../` 前缀）。
- 本仓库 `AGENTS.md`、`README.md`、`docs/**`、`packages/` 与 CLI 源码均为容器级内容，不在任何项目门禁范围内；
  `packages/` 自己的评审门禁（doc-sync 语义子集）实现期待定。





<!-- vibe-init:project-standing-orders-block:start -->
## Agent Note 纪律（vibe-init 管理）

本项目把非平凡变更的决策与提案记录为 Agent Note（位于 .agents/notes/），这是会话级常设要求：

- **何时写**：任何改变行为、架构、跨文件契约、流程/工具链、测试策略或格式（磁盘/网络/配置）的变更，
  必须在同一变更里新增或更新笔记；纯机械或局部编辑豁免。已有笔记拥有该决策时更新它即可，不另起重复。
- **写在哪里**：按生命周期/分类目录（`proposed|implemented|rejected|archived` / `feature|bug-fix|simplification|architecture|process|testing`）与
  yyyy-mm-dd-topic-title.md 命名；完整规则见 [Agent Note 规则](.agents/notes/README.md)。
- **格式底线**：标题为 # Agent Note: <标题>，前三行含 Status: 行；正文以 ## Problem 开头，
  并必须含 ## Alternatives considered。
- **一致性**：新笔记先做 supersession 检查并与相关旧笔记交叉链接；implemented/ 笔记随实现保持现行
  （只更新事实）；archived/ 是冻结历史，不可改动、不可当作现行依据。
- **提交纪律**：每完成一个可独立验证的 step（一个有明确结果的实现、文档、配置或测试变更），必须先通过适用
  校验，再创建一个 Git commit；不要把多个已完成 step 合并到同一个 commit。

EN: standing order — record non-trivial decisions as Agent Notes under .agents/notes/
(four-quadrant lifecycle, dated naming, required header/format). Full rules: [Agent Note rules](.agents/notes/README.md).
- **Commit discipline**: after each independently verifiable step (one implementation, documentation, configuration, or test change with a clear result), run the applicable checks and create one Git commit. Do not combine multiple completed steps in one commit.
<!-- vibe-init:project-standing-orders-block:end -->

<!-- vibe-init:feature-text-link-management:start -->
## 文本链接管理（vibe-init feature: textLinkManagement）

- 文档、规则与笔记之间的引用一律用**相对 Markdown 链接**（如 `[格式约定](../docs/format.md)`——仅示意语法，目标须真实存在），
  不用裸标题文字、章节编号或无法校验的指向。
- Agent Note 的目录、格式与生命周期见 [Agent Note 规则](.agents/notes/README.md)。
- 链接目标必须真实存在、大小写与相对路径正确；新增、改名、移动或删除目标文件时，在**同一变更**里
  更新所有入链，保持无断链。
- 悬空链接只允许出现在显式标注处（示意图、说明性锚点）；其余一律视为待修复缺陷。
- 机械校验由 vibe-init 的 docGates 工具链执行（verify-md-links，默认安装）：
  `pnpm -C .vibe-init/toolchain run doc-sync` 会枚举全项目 .md 链接并核对目标与锚点存在性。

EN: cross-references between docs/rules/notes use relative Markdown links; targets must exist and
every rename/move/delete updates all inbound links in the same change. The [Agent Note rules](.agents/notes/README.md)
cover the note tree and format. The docGates toolchain (verify-md-links, installed by default)
enforces this mechanically via `pnpm -C .vibe-init/toolchain run doc-sync`.
<!-- vibe-init:feature-text-link-management:end -->

<!-- vibe-init:feature-doc-budgets:start -->
## 文档分层与篇幅预算（vibe-init feature: docBudgets）

- **分层两档为主**：tutorial（教程：按序导向一个结果，每步只引入所需概念）与 reference（参考：定义查询
  范围与当前行为，无教学序列）。**one home per fact**——每个事实只在它的档位详述，其它位置用链接指向。
- 文档归属与写作规范见 [docs/AGENTS.md](docs/AGENTS.md)。
- **篇幅预算是护栏而非削减目标**：长期维护文档设字数软上限；超限先重组、下移内容或链接到所属档位，
  而不是新增重复文档；确需提额时在变更里说明理由。编辑目标为根 `AGENTS.md` ≤1600 词、普通子树
  `AGENTS.md` ≤600 词、`docs/AGENTS.md` ≤1250 词，并保留至少 5% 余量。
- 文档分类与分层选择先于写作：先定位文档归属、再定详略与档位、tutorial 按前置知识排序、低层细节用链接替代。
- Agent Note（.agents/notes/）与代码注释不属本档位。预算的机械执行由 vibe-init 的 docGates 工具链提供
  （verify-doc-budgets，默认安装；默认预算根 `AGENTS.md` 与 `docs/AGENTS.md`，档位清单在
  `.vibe-init/toolchain/scripts/doc-budgets.manifest.json`）。门禁变红时先迁移、再压缩，只有确有空间需求时才提额。

EN: doc tiers (tutorial/reference, one home per fact) plus wordcount budgets as guardrails;
classification precedes writing. The [documentation standard](docs/AGENTS.md) owns placement and
writing rules. Editorial targets are root AGENTS.md ≤1600 words, ordinary subtree AGENTS.md ≤600 words,
and docs/AGENTS.md ≤1250 words with at least 5% headroom. Budget ceilings are enforced mechanically
by the docGates toolchain (verify-doc-budgets, installed by default; budget list lives in
`.vibe-init/toolchain/scripts/doc-budgets.manifest.json`); relocate, then condense, before raising a ceiling.
<!-- vibe-init:feature-doc-budgets:end -->
