# AGENTS.md — dsh-rules 仓库入口

本仓库即 **dsh-rules** 插件本体：仓库根就是插件源码（项目级初始化器）——对每个项目物化出受管面
（项目根 AGENTS.md 的 marker 规则段 + `.agents/notes/` 笔记骨架 + 选定技能副本），**不触碰用户全局面**
（~/.dsh/AGENTS.md、用户技能根）。规则与技能文本的唯一版本化出处是同仓的 `rules-pack/`，插件只做
项目级安装/管理；项目文档在 `docs/`。
范围/目标口径：`docs/REQUIREMENTS-dsh-rules-plugin.md`（**定案 v1.0**）；实现方案与取舍记录在
`.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md`。

> EN TL;DR: this repo is the **dsh-rules** plugin itself — a per-project initializer. The repo root
> holds the plugin sources, `rules-pack/` is the single versioned content source, and the project
> docs live in `docs/`. For each project it materializes a managed surface: marker-wrapped rule
> segments in the root `AGENTS.md` (note discipline + text-link management by default), a fresh
> bilingual-ready notes skeleton under `.agents/notes/`, and declared skill copies under
> `.agents/skills/` managed like dependency packages. It never touches the user-global plane
> (`~/.dsh/AGENTS.md`, user skill roots). Scope authority: `REQUIREMENTS-dsh-rules-plugin.md` v1.0
> (+ M1b decisions D11–D13); rule-pack content (skeleton gates, bilingual
> trio, pointer block, feature sections, docGates toolchain under `toolchain/`) is distilled from
> `../vibe-coding-templates/` and sha256-synced; `skills-optional/` is the declared default project skill set.

## 入口文档

- [`README.md`](README.md) — 仓库总览 + 插件说明（命令面、物化语义、挂载、当前状态）。
- [`docs/README.md`](docs/README.md) — 项目文档索引与总览（2026-09-04 目录调整由仓库根移入 docs/）。
- [`docs/REQUIREMENTS-dsh-rules-plugin.md`](docs/REQUIREMENTS-dsh-rules-plugin.md) — 需求与目标
  （**定案 v1.0**；据用户决策：**项目级初始化器、不碰全局面**；作为唯一范围口径；
  决策基线 D1–D13 见文档 §0）。
- [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md) — 验收追溯矩阵。
- [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md)、
  [实现历史 Agent Note](.agents/notes/implemented/process/2026-09-04-dsh-rules-implementation-history.md)、
  [Upgrade 所有权迁移 Note](.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) — 实现设计与决策级历史。
- [`rules-pack/README.md`](rules-pack/README.md) — 内置规则包内容映射与门禁说明。

## 目录结构（2026-09-04 调整后）

```
dsh-rules/                      # 仓库根 = 插件源码（原 plugin/ 展平到根）
├── AGENTS.md                   # 本文件（仓库入口）
├── README.md                   # 插件说明（原 plugin/README.md 上移；命令面/物化语义/挂载）
├── dsh-rules.mjs               # Cordis 插件入口（挂载无副作用）
├── bin/dsh-rules.mjs           # CLI 入口（init/upgrade/status/audit/hash/list-skills）
├── lib/                        # engine / pack / cli / diff
├── test/                       # 自动化测试（node:test；仓库根 pnpm test，48 条）
├── package.json                # name @xuxf/dsh-rules；bin；dsh.bundle 元数据
├── cordis.patch.yml            # 发布包的 DSH bundle patch
├── cordis.patch.sample.yml     # checkout 开发挂载样例（指向仓库根入口）
├── rules-pack/                 # 内置规则包 —— 唯一版本化内容源（manifest.json + sha256）
│   ├── notes-skeleton/         #   → 项目 .agents/notes/ 骨架（双语三件套+四象限）
│   ├── standing-orders-block.md#   → 项目根 AGENTS.md 的 marker 段（指针式）
│   ├── skills-optional/        #   → 项目 .agents/skills/（依赖包式副本；全部声明技能默认安装）
│   ├── features/               #   特性规则段（textLinkManagement/bilingualDocsDiscipline 等）
│   └── toolchain/              #   docGates 工具链（spec.json 组 → 项目 .dsh-rules/toolchain）
└── docs/                       # 项目文档（原仓库根文档移入本目录）
    ├── README.md               #   总览/目录结构/当前状态（原根 README）
    ├── AGENTS.md               #   文档分层、篇幅目标与预算门禁规范
    ├── REQUIREMENTS-dsh-rules-plugin.md  # 需求与目标（定案 v1.0，范围口径）
    ├── DESIGN-dsh-rules-plugin.md        # 设计 Agent Note 的兼容指针页
    ├── ACCEPTANCE.md           #   需求-验证追溯矩阵
    └── CHANGELOG.md            #   实现历史 Agent Note 的兼容指针页
```

- 内容源与插件同仓：`rules-pack/` 的 `manifest.json` 声明文件清单与 `sha256`（含 features 开关与
  toolchain 声明）；子目录映射物化目标见 [`rules-pack/README.md`](rules-pack/README.md)。`global/`
  （→ ~/.dsh）已按 v1.0 退役删除。
- 不再有 `.template/` 或随插件分发的消费者 `.agents/` 内容子树（2026-09-04 目录调整删除）：其语料/工具链
  已在 M1b 归入 `rules-pack/toolchain/`（docGates）；仓库自身 `.agents/notes/` 仅保留开发记录，
  `skills-optional/` 内容已提炼为全部默认项目技能。

## 会话规则

- 开工前先读「入口文档」；**范围与目标以 `docs/REQUIREMENTS…`（v1.0 定案）为准**，实现方案与取舍以
  [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md) 为准。
- **规则内容一律写入 `rules-pack/`**（不把规则内容硬编码进插件）；改仓库根插件源码
  （`dsh-rules.mjs`、`bin/`、`lib/`、`test/`、`package.json`）只动安装/管理逻辑。
- 修改 `rules-pack/` 文件时保持 `manifest.json` 的 files 清单与 `sha256` 同步
  （`status`/`upgrade` 依赖内容寻址；刷新用 `node bin/dsh-rules.mjs hash --pack rules-pack` 或
  `$DSH_RULES_PACK`）；改动 `toolchain/**` 分组/依赖时同步 `spec.json`，并跑仓库根 `pnpm test`
  （48 条含 docGates 物化/移除、upgrade 所有权迁移与 tarball 安装回归）。
- 修改 `docs/` 或根 README 时留意跨目录相对链接（`docs/**` 内互链、指向根 `AGENTS.md`/`README.md`
  需 `../` 前缀）。
- 本仓库 `AGENTS.md`、`README.md`、`docs/**`、`rules-pack/` 与插件源码均为容器级内容，不在任何
  项目门禁范围内；`rules-pack/` 自己的评审门禁（doc-sync 语义子集）实现期待定。

<!-- dsh-rules:project-standing-orders-block:start -->
## Agent Note 纪律（dsh-rules 管理）

本项目把非平凡变更的决策与提案记录为 Agent Note（位于 .agents/notes/），这是会话级常设要求：

- **何时写**：任何改变行为、架构、跨文件契约、流程/工具链、测试策略或格式（磁盘/网络/配置）的变更，
  必须在同一变更里新增或更新笔记；纯机械或局部编辑豁免。已有笔记拥有该决策时更新它即可，不另起重复。
- **写在哪里**：按生命周期/分类目录（`proposed|implemented|rejected|archived` / `feature|bug-fix|simplification|architecture|process|testing`）与
  yyyy-mm-dd-topic-title.md 命名；完整规则见 [Agent Note 规则](.agents/notes/README.md)。
- **格式底线**：标题为 # Agent Note: <标题>，前三行含 Status: 行；正文以 ## Problem 开头，
  并必须含 ## Alternatives considered。
- **一致性**：新笔记先做 supersession 检查并与相关旧笔记交叉链接；implemented/ 笔记随实现保持现行
  （只更新事实）；archived/ 是冻结历史，不可改动、不可当作现行依据。

EN: standing order — record non-trivial decisions as Agent Notes under .agents/notes/
(four-quadrant lifecycle, dated naming, required header/format). Full rules: [Agent Note rules](.agents/notes/README.md).
<!-- dsh-rules:project-standing-orders-block:end -->

<!-- dsh-rules:feature-text-link-management:start -->
## 文本链接管理（dsh-rules feature: textLinkManagement）

- 文档、规则与笔记之间的引用一律用**相对 Markdown 链接**（如 `[格式约定](../docs/format.md)`——仅示意语法，目标须真实存在），
  不用裸标题文字、章节编号或无法校验的指向。
- Agent Note 的目录、格式与生命周期见 [Agent Note 规则](.agents/notes/README.md)。
- 链接目标必须真实存在、大小写与相对路径正确；新增、改名、移动或删除目标文件时，在**同一变更**里
  更新所有入链，保持无断链。
- 悬空链接只允许出现在显式标注处（示意图、说明性锚点）；其余一律视为待修复缺陷。
- 机械校验由 dsh-rules 的 docGates 工具链执行（verify-md-links，默认安装）：
  `pnpm -C .dsh-rules/toolchain run doc-sync` 会枚举全项目 .md 链接并核对目标与锚点存在性。

EN: cross-references between docs/rules/notes use relative Markdown links; targets must exist and
every rename/move/delete updates all inbound links in the same change. The [Agent Note rules](.agents/notes/README.md)
cover the note tree and format. The docGates toolchain (verify-md-links, installed by default)
enforces this mechanically via `pnpm -C .dsh-rules/toolchain run doc-sync`.
<!-- dsh-rules:feature-text-link-management:end -->

<!-- dsh-rules:feature-doc-budgets:start -->
## 文档分层与篇幅预算（dsh-rules feature: docBudgets）

- **分层两档为主**：tutorial（教程：按序导向一个结果，每步只引入所需概念）与 reference（参考：定义查询
  范围与当前行为，无教学序列）。**one home per fact**——每个事实只在它的档位详述，其它位置用链接指向。
- 文档归属与写作规范见 [docs/AGENTS.md](docs/AGENTS.md)。
- **篇幅预算是护栏而非削减目标**：长期维护文档设字数软上限；超限先重组、下移内容或链接到所属档位，
  而不是新增重复文档；确需提额时在变更里说明理由。编辑目标为根 `AGENTS.md` ≤1600 词、普通子树
  `AGENTS.md` ≤600 词、`docs/AGENTS.md` ≤1250 词，并保留至少 5% 余量。
- 文档分类与分层选择先于写作：先定位文档归属、再定详略与档位、tutorial 按前置知识排序、低层细节用链接替代。
- Agent Note（.agents/notes/）与代码注释不属本档位。预算的机械执行由 dsh-rules 的 docGates 工具链提供
  （verify-doc-budgets，默认安装；默认预算根 `AGENTS.md` 与 `docs/AGENTS.md`，档位清单在
  `.dsh-rules/toolchain/scripts/doc-budgets.manifest.json`）。门禁变红时先迁移、再压缩，只有确有空间需求时才提额。

EN: doc tiers (tutorial/reference, one home per fact) plus wordcount budgets as guardrails;
classification precedes writing. The [documentation standard](docs/AGENTS.md) owns placement and
writing rules. Editorial targets are root AGENTS.md ≤1600 words, ordinary subtree AGENTS.md ≤600 words,
and docs/AGENTS.md ≤1250 words with at least 5% headroom. Budget ceilings are enforced mechanically
by the docGates toolchain (verify-doc-budgets, installed by default; budget list lives in
`.dsh-rules/toolchain/scripts/doc-budgets.manifest.json`); relocate, then condense, before raising a ceiling.
<!-- dsh-rules:feature-doc-budgets:end -->

<!-- dsh-rules:feature-bilingual-docs:start -->
## 双语文档纪律（dsh-rules feature: bilingualDocsDiscipline，默认关）

- 启用双语后，主文档（.md）与中文配对（.zh.md）**逐节对应**；Agent Note 的头 token
  （# Agent Note: 与 Status: 行）保持英文原样。
- 每对文档登记进所在目录的 README.i18n.yaml（或项目约定的配对表）；任何一侧的修改都必须在
  **同一变更**内同步另一侧，避免两侧漂移。
- 归档/移动时须整对移动，并保留双方结构对应。
- 默认关闭：仅当项目确实双语交付时才开启；未开启时 .zh.md 与 i18n 侧车文件可忽略。

EN: bilingual docs discipline (off by default) — .md/.zh.md pairs stay section-aligned, are declared
in the i18n pair list, and change together in the same change.
<!-- dsh-rules:feature-bilingual-docs:end -->
