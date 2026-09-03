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
- M1 引擎：已按 v1.0 改造并通过冒烟验证（全局落点退役；幂等 init/upgrade；status/audit 只读项目面；
  冲突保护；`--skill` 项目技能副本；manifest features 默认值同步）。
- 规则内容：`rules-pack/` 内容提炼进行中（M1）——骨架门规、双语三件套、指针式根块、特性段已实写并同步
  manifest sha256；`skills-optional/` 与 docBudgets 正文待提炼。
- 待办：rules-pack 内容提炼（M1）；真实项目挂载与验证（M2）；M3 可分发（npm 包/官方化）。
