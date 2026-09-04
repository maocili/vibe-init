# dsh-rules：把「模板引用」做成 DSH 插件 —— 设计方案（v1.0 对齐）

> 状态：实现方案稿（2026-09-03 按 REQUIREMENTS v1.0 对齐修订；2026-09-04 目录调整移入 docs/）。
> 本文档为容器级项目文档（docs/），不受 rules-pack/ 物化内容门禁约束。
> 权威关系：范围与目标以 REQUIREMENTS-dsh-rules-plugin.md（v1.0 定案）为准——本文档原 §1/§2
> 的目标/分层口径已被其取代；本文只承载实现方案（物化语义、manifest、命令面、挂载、里程碑）。
> v1.0 修订要点：全局面设计整体移除（不再写 ~/.dsh/AGENTS.md、不动用户技能根；install-global 退役）；
> 技能改为项目级 .agents/skills/ 依赖包式副本；features 默认值按 REQUIREMENTS §3.2（textLinkManagement /
> bilingualPairing / docBudgets 默认开，bilingualDocsDiscipline 默认关）。
> 命名沿革：草案曾名 dsh-discipline / discipline-*；2026-09-03 定案插件名与命令前缀 dsh-rules、规则包目录 rules-pack。
> EN TL;DR: implementation-plan document for dsh-rules, a per-project initializer plugin (scope
> authority: REQUIREMENTS v1.0). For each project it materializes a managed surface from the
> versioned rule pack: marker-wrapped segments in the root AGENTS.md (note-discipline block +
> feature sections per manifest defaults), a fresh bilingual-ready notes skeleton under
> .agents/notes/, and user-selected skill copies under .agents/skills/ managed like dependencies.
> The global plane is out of scope — nothing is ever written to ~/.dsh/AGENTS.md or user skill roots.

---

## 1. 背景与目标（要点；验收口径见 REQUIREMENTS v1.0）

旧做法是把「vibe-coding-templates 纪律」拷贝整棵容器子树进下游仓库，产生三个病根：

1. 规则不生效 —— 常设规则放在嵌套目录（如 .template/AGENTS.md），不在会话基线，笔记语料成死目录；
2. 拷贝即漂移 —— 手动复制进项目后无版本跟踪，源改了项目不跟进，冗余不可审计；
3. 开发史污染 —— 拷贝把容器自身决策记录与 harness 专用物原样带入下游。

v1.0 解空间：每个项目由插件初始化出一份受管面（根 AGENTS.md 的 marker 规则段 + .agents/notes/ 骨架
+ 选定技能副本），内容来自版本化规则包（本仓库 rules-pack/），插件只装入与维护；不拷贝裸内容，
也不触碰用户全局面。

## 2. 物化归属模型（v1.0：全部落在项目内）

| 层 | 内容 | 落点 | 机制 |
|---|---|---|---|
| 项目常设规则段 | note 纪律块（指针式：短块、指向骨架门规，受基线字节预算约束，REQUIREMENTS DP-A）+ 按 features 默认开启的特性段 | <project>/AGENTS.md（marker 包裹） | 随项目会话基线自动注入 |
| 项目笔记骨架 | README 三件套（双语就绪）+ 四象限生命周期（implemented/archived/proposed/rejected）+ AGENTS.md 门规 + manifest | <project>/.agents/notes/ | 仅结构、无历史内容；项目后续只写自己的笔记 |
| 项目技能副本 | 用户挑选的通用技能（声明式、可升级） | <project>/.agents/skills/<name>/ | 依赖包式管理；用户自装技能识别但不覆盖（DP-F/DP-G 暂缓细化） |
| 内容源（作者仓库） | 上述全部文本的唯一版本化出处 | 本仓库 rules-pack/（语料提炼自 ../vibe-coding-templates） | manifest + sha256 内容寻址 |
| ~~全局面~~ | ~~~/.dsh/AGENTS.md、用户技能根~~ | 已从范围删除（v1.0 D1/D2） | 插件任何命令不写不删不更 |

边界：笔记（项目决策记录）与规则（受管物化面）都只属于项目自身；规则文本版本化在规则包，插件
只是安装器/管理器（原则同旧 DESIGN §3，未变）。

## 3. 总体架构（v1.0）

~~~
dsh-rules 仓库（插件 + 内容源 + 项目文档）
  rules-pack/                 规则/技能文本唯一版本化出处（manifest + sha256）
    manifest.json             版本 + files[]（target/source/sha256/feature）+ features
    notes-skeleton/**         项目笔记骨架（README 三件套、门规、manifest、四象限）
    standing-orders-block.md  项目根 AGENTS.md 的 note 纪律块（指针式）
    features/*.md             特性规则段（text-link、bilingual-docs…）
    toolchain/**             docGates 工具链（spec.json 组：scaffold/base/text-link/doc-budgets/bilingual/extras/hooks）
    skills-optional/**        可选通用技能（init --skill 挑选取用）
  仓库根（原 plugin/，2026-09-04 展平）  dsh-rules 插件源码（host 层安装器/管理器：dsh-rules.mjs · bin/ · lib/ · test/）
  docs/                       项目文档（REQUIREMENTS/DESIGN/ACCEPTANCE/CHANGELOG；2026-09-04 移入）
        │ 动作仅 init/upgrade/status/audit/hash/list-skills，且只对项目（不写全局面）
        ▼
项目受管面：<project>/AGENTS.md 段 + .agents/notes/** + .agents/skills/<name>/**
~~~

为什么不把规则内容硬编码进插件：规则包与插件若各自持有一份，必然双份漂移。插件只是安装器/管理器，
内容一律来自版本化规则包；插件按摘要（sha256）比对决定写入/更新/移除。

## 4. 规则包格式（实现态）

rules-pack/manifest.json（当前实现；features 语义按 REQUIREMENTS §3.2）：

~~~json
{
  "version": "0.1.0-draft",
  "files": [
    { "id": "project-notes-readme",        "target": ".agents/notes/README.md",        "source": "notes-skeleton/README.md" },
    { "id": "project-notes-readme-zh",     "target": ".agents/notes/README.zh.md",     "source": "notes-skeleton/README.zh.md" },
    { "id": "project-notes-i18n",          "target": ".agents/notes/README.i18n.yaml", "source": "notes-skeleton/README.i18n.yaml" },
    { "id": "project-notes-agents",        "target": ".agents/notes/AGENTS.md",        "source": "notes-skeleton/AGENTS.md" },
    { "id": "project-notes-manifest",      "target": ".agents/notes/manifest.json",    "source": "notes-skeleton/manifest.json" },
    { "id": "project-standing-orders-block", "target": "AGENTS.md", "source": "standing-orders-block.md", "mode": "append-under-marker" },
    { "id": "feature-text-link-management",  "target": "AGENTS.md", "source": "features/text-link-management.md", "mode": "append-under-marker", "feature": "textLinkManagement" },
    { "id": "feature-bilingual-docs",        "target": "AGENTS.md", "source": "features/bilingual-docs.md",       "mode": "append-under-marker", "feature": "bilingualDocsDiscipline" }
  ],
  "features": {
    "textLinkManagement": true, "bilingualPairing": true,
    "bilingualDocsDiscipline": false, "docBudgets": true, "optionalSkills": []
  }
}
~~~

要点：
- 来源文件全部为本仓库 rules-pack/ 下的普通 md/json，可走现有文档规范与评审；
- sha256 内容寻址：status 报漂移，upgrade 只动规则包版本变化的物化文件，绝不动项目自己写的笔记；
- bilingualPairing（默认 true）= 双语骨架三件套就绪（README.md/zh.md/i18n.yaml）；双语纪律段是独立 key
  bilingualDocsDiscipline（默认 false），两者解耦（REQUIREMENTS D3/D4/D9）；
- docBudgets 默认 true = doc 分层/预算轻量段入根 AGENTS.md（features/doc-budgets.md，2026-09-03）；
- 无任何 ~/ 目标行——全局面不物化（v1.0）。
- M1b（2026-09-04）：manifest 顶层增 `"toolchain": { "target": ".dsh-rules/toolchain", "spec": "toolchain/spec.json" }`；
  features 增 `docGates:true`、`docGatesExtras:false`。`toolchain/spec.json` 声明组：{ id, feature, src, verify[],
  scripts{}, deps{} }，每组整树镜像到 toolchain 目标下；`package.json`（build/lint/verify-*/doc-sync/组 scripts/依赖并集）
  由引擎按启用组确定性组装（managedUpdate 语义），doc-sync = 已启用 verify 名串联。

## 5. 命令面与物化语义（CLI 已实现，2026-09-03 冒烟通过）

| 命令 | 作用对象 | 行为 |
|---|---|---|
| init | 项目 | 生成 .agents/notes/ 骨架 + 根 AGENTS.md marker 段（note 纪律块 + 默认特性段）+ --skill 技能副本 |
| upgrade | 项目 | init 的显式别名（同引擎幂等迁移） |
| status | 项目 | 只读：逐文件 ok/create/update/conflict/missing |
| audit | 项目 | status + 规则包完整性（sha256 漂移）+ 旧残留启发（.template/ 残留、.agents/skills/dsh-*、notes 顶层未知文件） |
| hash | 规则包 | 刷新 manifest sha256 |
| list-skills | 规则包 | 列出 skills-optional 可选技能 |

选项：--project（默认 cwd，向上找 .git 定界）· --pack（默认本仓库 rules-pack/，可 $DSH_RULES_PACK）·
--skill <name>（可重复）· --feature <key>=<true|false>（可重复：本次运行覆盖 feature 默认值，关闭的既有段被移除）·
--dry-run · --yes · --force · --json。install-global 已退役：调用返回明确错误
（v1.0 D1/D2，不写全局面）。

物化语义（engine 已实现）：
- marker 段：每段以 <!-- dsh-rules:<id>:start/end --> 包裹，按 id 原位替换；段块不带尾换行、段间空行
  由 upsert 统一排版 → 字节级幂等；同文件多段在一次运行内按序累积后落盘（互不覆盖）。
- 冲突策略：copy 型文件（骨架/技能）已存在且不同 → conflict 绝不覆盖（除非 --force）；段型写入永不冲突
- docGates 工具链（(d) 阶段）：伞 `docGates` 关 ⇒ 整目录不物化/移除；组按各自 feature 门控（scaffold/常设门禁/挂钩随伞）；
  关闭组/伞对受管副本产出**移除**（字节等于包源 → 删；用户改动/漂移 → conflict 保留，`--force` 强制）；移除后向上裁剪空目录；
  audit 识别受管 `.dsh-rules/toolchain/`（未知多余文件报 info；node_modules/锁文件/组装 package.json 豁免），`.template/` 旧残留启发不变
  （只动自己的段）；段外用户内容（产品规则）一律保留。
- 骨架镜像：规划注释（[实现期]/待填充/占位 的整行 HTML 注释）与 legacy dsh-rules:* 标记行在物化前剥离，
  规划注释永不进入消费者；.gitkeep 只保目录。
- 技能副本：--skill 从 skills-optional/<name> 复制到 <project>/.agents/skills/<name>；声明集合记录/移除、
  自装识别口径（REQUIREMENTS DP-F/DP-G）暂缓。
- 规划注释剥离与内容寻址实现细节见 lib/pack.mjs（仓库根）。

## 6. 挂载与生命周期

- 本机挂载：~/.dsh/profiles/web/cordis.patch.yml 增加 insert（id: dsh-rules，name: file://…/dsh-rules.mjs），
  与现有 dsh-obsidian-bridge 同机制；样例见 cordis.patch.sample.yml。插件 apply() 无副作用：只校验规则包
  并就绪提示，一切物化由显式命令触发（REQUIREMENTS R10）。
- 权限模型：插件运行在 host 层；写项目内容前走「先展示差异、用户确认」（--dry-run 预览 / --yes 显式执行，
  非 TTY 拒绝执行）。不再有写 ~/.dsh 的职责（v1.0）。
- 可分发形态（后续）：包装为 profile 依赖的 npm 包或官方化（M3）。
- 待验证 API 面：第三方本地插件能否用 @deepseek-ai/dsh-tools 的 defineTool 注册会话工具、如何注册 GUI
  菜单项；若不可用，回退 = 插件做 host 层物化 + 随包 skill 驱动（dsh-translate-docs 同模式）。

## 7. 迁移路径

### 7.1 对已污染仓库（mandarin 等）
1. dsh-rules init 以只读方式报出：旧容器 note（notes 顶层未知文件）、.template/ 残留、.agents/skills/dsh-*
   冗余（conflict/audit 启发）；
2. 交互处置建议：开发史 note 隔离到 imported-<date>/ 或删除（不进入生命周期树）；冗余技能清理；
3. 写入新鲜骨架与根规则段；此后项目只写自己的笔记。

### 7.2 本仓库消费契约（沿用既有提议）
- 根 AGENTS.md 的「复制 .template/ + .agents/」指引退役，改为「安装 dsh-rules」；
- .template/ 保留为重度消费者（自带 doc 门禁/双语配对）的可选项；
- 容器自身开发史处置沿用「笔记语料处置（暂缓）」决策，本设计不替它拍板。

## 8. 里程碑（v1.0 对齐）

| 阶段 | 内容 | 状态/验收 |
|---|---|---|
| M0 引擎对齐 | 全局面退役、项目级技能副本、features v1.0、同文件多段/幂等修复 | 已完成（2026-09-03 冒烟：幂等 init/upgrade、conflict 保护、技能副本） |
| M1 内容提炼 | rules-pack 正文从 ../vibe-coding-templates 提炼（指针式根块、骨架门规、双语三件套、textLink/bilingualDocs/docBudgets 特性段）+ manifest sha256 | 已完成（2026-09-03）；skills-optional 待 DP-F 解除 |
| M2 真实项目 | 挂载 cordis.patch；对一个真实新项目跑 init；污染仓库迁移实测 | **已通过（2026-09-03）**：宿主重启日志含 [dsh-rules] mounted；真实新项目 /Users/xuxifeng/Work/dsh-rules-demo init 幂等（重跑 nothing to do）、status/audit 通过（无 global、无 drift）；污染迁移为可选演示 |
| M3 可分发 | 规则包打 tag；插件包装 npm 包/官方化；文档 | 另一机器/另一项目可一键安装 |

## 9. 明确不做（防蔓延）

- 不做全局规则安装、不写 ~/.dsh、不动用户级技能根（v1.0 D1/D2）；
- 默认不物化双语纪律段（bilingualDocsDiscipline 默认关）；doc-budget/doc-gate 门禁运行时已收编为受管 docGates 特性
  （M1b，默认开；`docGates=false` 即移除），不做的是非伞内、非 opt-in 的容器/作者专用物（vitest 测试链、
  lefthook 全量安装器、docs/ 语料正文整树）；
- 不做规则内容的「新家」——rules-pack/ 是唯一出处；
- 不管理项目内非本插件物化的内容（只识别与报告）。

## 10. 决策记录与待办

- 已定案：命名（dsh-rules/rules-pack）；范围与目标（REQUIREMENTS v1.0 D1–D10，含全局面退役、features
  默认值、指针式根块、双语纪律段独立 key）；**M1b（2026-09-04，REQUIREMENTS D11/D12）**：doc-gate/双语/挂钩工具链
  入 rules-pack，物化为 docGates 伞 + docGatesExtras + 每 feature 脚本组（方案甲），落地 `.dsh-rules/toolchain/`。
- 待办（实现细节）：技能声明集合的记录与移除、自装识别口径（DP-F/DP-G）；defineTool/GUI 注册验证；
  真实挂载与 M2 验证（需用户确认）；M3 分发。
