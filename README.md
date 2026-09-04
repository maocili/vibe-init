# dsh-rules

把「vibe-coding-templates 模板引用」做成 DSH 插件的开发仓库：插件是**项目级初始化器**——对每个项目
物化出受管面（根 `AGENTS.md` 规则段 + `.agents/notes/` 笔记骨架 + 选定技能副本），**不触碰用户全局面**
（~/.dsh/AGENTS.md、用户技能根）。规则与技能文本以内置 `rules-pack/` 版本化承载，插件只做安装/管理。

> EN TL;DR: Develop **dsh-rules**, a per-project initializer DSH plugin. For each project it
> materializes a managed surface from a versioned rule pack: marker-wrapped rule segments in the
> root `AGENTS.md` (note discipline + text-link management by default), a fresh bilingual-ready
> notes skeleton under `.agents/notes/`, and selected skill copies under `.agents/skills/` managed
> like dependency packages. It never writes the user-global plane. Scope authority:
> `REQUIREMENTS-dsh-rules-plugin.md` v1.0 (finalized; supersedes DESIGN §1/§2).

## 文档

- [`AGENTS.md`](AGENTS.md) — 仓库入口（会话基线）。
- [`REQUIREMENTS-dsh-rules-plugin.md`](REQUIREMENTS-dsh-rules-plugin.md) — 需求与目标（**定案 v1.0**，范围口径）。
- [`ACCEPTANCE.md`](ACCEPTANCE.md) — 需求-验证追溯矩阵（D1–D10 / R1–R10 → 测试与证据）。
- `DESIGN-dsh-rules-plugin.md` — 设计方案（实现方案细节的工作稿，已按 v1.0 对齐：全局面设计移除）。

## 目录结构

```
dsh-rules/
├── REQUIREMENTS-dsh-rules-plugin.md  # 需求与目标（定案 v1.0，范围口径）
├── DESIGN-dsh-rules-plugin.md        # 设计方案（工作稿，已按 v1.0 对齐）
├── rules-pack/                       # 内置规则包 —— 唯一版本化内容源（manifest + sha256）
│   ├── manifest.json                 #   version + files[]（target/source/sha256）+ features 开关
│   ├── notes-skeleton/               #   → <project>/.agents/notes/ 骨架（双语三件套+四象限）
│   ├── standing-orders-block.md      #   → 项目根 AGENTS.md 的 marker 规则块（指针式）
│   ├── skills-optional/              #   可选通用技能（init --skill 挑选取用，依赖包式副本）
│   ├── toolchain/                     #   docGates 工具链（spec.json 组：门禁/双语/挂钩 → .dsh-rules/toolchain）
│   └── features/                     #   特性规则族（textLinkManagement/bilingualDocsDiscipline 等）
└── plugin/                           # dsh-rules 插件源码（host 层，项目级安装器/管理器）
    ├── dsh-rules.mjs                 #   Cordis 插件入口（挂载无副作用）
    ├── bin/dsh-rules.mjs             #   CLI 入口（init/upgrade/status/audit/hash/list-skills）
    ├── lib/                          #   engine / pack / cli / diff
    ├── cordis.patch.sample.yml       #   挂载样例（cordis.patch.yml insert）
    └── README.md
```

## 当前状态与下一步

- 需求口径：**REQUIREMENTS v1.0 定案**（项目级初始化器、不碰全局面、默认特性开、双语纪律段默认关）。
- 引擎：v1.0 全功能（全局落点退役、幂等 init/upgrade、status/audit 只读项目面、冲突保护、`--skill`
  项目技能副本、`--feature` 按次覆盖）+ **M1b docGates 工具链**（spec.json 组门控物化、package.json 组装、
  关闭移除、audit 感知）；**自动化测试 26/26 绿**（引擎语义 + CLI 端到端 + 升级隔离/污染 + docGates 物化/移除 + apply 无副作用）。
- 规则内容：`rules-pack/` 已实写——骨架门规、双语三件套（含有效 pairing record）、指针式根块、
  textLinkManagement/bilingualDocsDiscipline/docBudgets 特性段、**`toolchain/` docGates 工具链**（doc-gate/双语/挂钩，
  notes 骨架含归档六类目录），manifest sha256 已同步；`skills-optional/`（DP-F）暂空。
- 变更历史见 [CHANGELOG.md](CHANGELOG.md)。
- 挂载与 M2：**已完成**（2026-09-03）——cordis.patch.yml insert 生效（宿主日志 mounted），真实项目
  /Users/xuxifeng/Work/dsh-rules-demo init/status/audit 验证通过（可在此目录开新会话体验）。
- M1b 已完成（2026-09-04；真实验证：临时项目默认与 bilingual doc-sync 全绿 exit 0、pre-commit 挂钩生效，见 CHANGELOG/ACCEPTANCE）。
- 待办：DP-F/DP-G 解除后实现（skills-optional、声明集/自装识别）；`--feature` 覆盖持久化（当前按次生效，默认以 manifest 为准）；
  M3 可分发（npm 包/官方化）。
