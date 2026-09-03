# dsh-rules

把「vibe-coding-templates 模板引用」做成 DSH 插件的开发仓库 —— 插件管理某个 project 的规则
（agent note、文本链接管理、双语文档等，含但不限于），规则以内置 `rules-pack/` 版本化承载。

> EN TL;DR: Develop the **dsh-rules** DSH plugin that installs standing orders once into the
> user-global plane (`~/.dsh/AGENTS.md`, user skill roots) and materializes only a fresh notes
> skeleton per project (`.agents/notes/` + a standing-orders block in root `AGENTS.md`). The rule
> pack lives in this repo (`rules-pack/`) and is the single versioned content source.

## 文档

- [`AGENTS.md`](AGENTS.md) — 仓库入口（会话基线）。
- `DESIGN-dsh-rules-plugin.md` — 设计方案（工作稿；实现前的决策权威）。

## 目录结构

```
dsh-rules/
├── DESIGN-dsh-rules-plugin.md   # 设计方案（现有，工作稿）
├── rules-pack/                       # 内置规则包 —— 唯一版本化内容源（manifest + sha256 门禁）
│   ├── manifest.json                 #   version + files[]（target/source/sha256）+ features 开关
│   ├── global/AGENTS.md              #   → ~/.dsh/AGENTS.md 全局常设规则
│   ├── notes-skeleton/               #   → <project>/.agents/notes/ 新鲜骨架（README 三件套+四象限）
│   ├── standing-orders-block.md      #   → 项目根 AGENTS.md 的 marker 规则块
│   ├── skills-optional/              #   可选通用技能（SKILL.md，用户挑选）
│   └── features/                     #   特性规则族：text-link-management / bilingual-docs（默认关）
└── plugin/                           # dsh-rules 插件源码（host 层，安装器/管理器）
    ├── dsh-rules.mjs
    ├── cordis.patch.sample.yml       #   挂载样例（cordis.patch.yml insert）
    └── README.md
```

## 当前状态与下一步

- 目录与占位文件已就绪；各占位文件标注 `[实现期]`，内容从 `/Users/xuxifeng/Work/vibe-coding-templates`
  （`.template/`、`.agents/`）提炼填充。
- 实现顺序（DESIGN §8）：**M0** 手放全局规则 + 通用 skill 验证注入 → **M1** 挂载插件、实现
  `install-global`/`init` → **M2** `status`/`upgrade`/`audit` + 污染迁移 → **M3** 可分发。
- 说明：占位文件多为空模板；`rules-pack/notes-skeleton/{proposed,rejected}` 目录靠 `.gitkeep`
  保持存在，实际骨架物化在插件 `init` 时生成。
