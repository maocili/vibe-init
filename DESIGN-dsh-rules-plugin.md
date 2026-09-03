# dsh-rules：把“模板引用”做成 DSH 插件 —— 设计方案

> 状态：设计提案（未实现）。本文档是容器级文件，不参与 `.template/` 门禁范围。
> 命名沿革：草案曾名 dsh-discipline / discipline-*；2026-09-03 定案插件名与命令前缀
> dsh-rules、规则包目录 rules-pack，本文档随仓库同步更名（DESIGN §10 问题 1）。
> 决策输入：用户确认 —— (1) 先出设计方案不改码；(2) 规则包内容源指向 vibe-coding-templates 仓库（路径 / git tag）；(3) 采用“规则+技能全局、项目仅笔记骨架”的混合分层；(4) 命名定案：插件名与命令前缀 dsh-rules、规则包目录 rules-pack（DESIGN §10 问题 1）。
> TL;DR (English): replace the copy-the-whole-container consumption model with a profile-level DSH plugin ("dsh-rules") that installs standing orders + generic skills **once** into the DSH user-global plane (`~/.dsh/AGENTS.md`, user skill roots) and materializes only a **fresh notes skeleton** into each project (`.agents/notes/` + a standing-orders block in root `AGENTS.md`). A versioned **rule pack** authored in this repo is the single content source; the plugin is only the installer/manager. This eliminates rule-sleeping (nested AGENTS.md never in baseline), skill duplication (global scan roots already exist), and dev-record pollution (container corpus never ships).

---

## 1. 背景：三个病根与目标

在引入 vibe-coding-templates 到其他项目（如 synthetic-dialogue-generator-mandarin）时暴露的问题：

1. **Agent note 不生效** —— 常设规则放在嵌套的 `.template/AGENTS.md`，DSH 基线只自动注入项目根 `AGENTS.md`/CLAUDE.md；根规则又让 agent 忽略 `.agents/`，笔记语料成为死目录。
2. **Skill 不可复用** —— `.agents/skills/` 里的 dsh-* 是 deepseek-harness 改写版（正文指向 harness 语义），复制进项目与 DSH 内置同名技能重复、无通用价值。
3. **开发记录污染** —— 按“复制 `.template/` + `.agents/`”指引，容器自身 25 篇开发史决策记录与技能原样进入下游仓库。

根本原因：**“纪律内容 = 拷贝进每个仓库的静态内容”**。拷贝既让规则失去与运行时（基线注入、技能扫描）的绑定，也把内容源的历史（开发史、harness 专用物）一并外泄，还引入版本漂移（容器改了，已拷贝项目不跟进）。

**目标**：把消费方式从“拷贝内容”改为“运行时能力”——一个 DSH 插件，负责安装与管理纪律规则，让：
- 规则在**每个会话基线里生效**（原生机制，非拷贝）；
- 通用技能装在**用户级目录一次**，处处可用；
- 项目仓库里只出现**属于它自己的笔记**，内容源的开发史在构造上不可能进入下游。

## 2. 分层归属模型（本设计的基础）

| 层 | 内容 | 存放位置 | 机制（已核实） |
|---|---|---|---|
| **全局规则** | 常设规则：何时写 Agent Note、文档分层、slop 清单、note 格式指针 | `~/.dsh/AGENTS.md` | agent-instructions 的 `USER_GLOBAL_FILE`：随每次会话基线注入，与项目根 AGENTS.md 并存（当前该文件不存在，机制空置） |
| **全局技能** | 真正通用的技能（由用户挑选；示例非 dsh-*） | `~/.agents/skills`（rank 500）或 `~/.dsh/skills`（rank 400，skipSystem） | skill-filesystem 固定扫描这些根 |
| **项目笔记骨架** | 空生命周期：notes README 三件套、`implemented/AGENTS.md`、`archived/AGENTS.md` + 六类 `.gitkeep` + 空 manifest、`proposed/` `rejected/` 空目录 | `<projectRoot>/.agents/notes/` | 仅结构，无任何历史内容；项目后续只写自己的笔记 |
| **项目常设规则块** | 根 `AGENTS.md` 中一段“Agent Note 纪律”说明（产品规则之上追加） | `<projectRoot>/AGENTS.md` | 随项目基线自动注入 |
| **内容源（作者仓库）** | 上述所有文本的**唯一版本化出处** | 本仓库（vibe-coding-templates） | 容器门禁（doc-sync）继续保证其质量 |

> 边界：笔记本身（项目决策记录）永远不会全局化；规则本身永远不会项目化复制。两者在“是否需要随仓库分发”上本质不同——这正是原模板把它们捆在一起才出问题的原因。

## 3. 总体架构

```
┌────────────────────────────── vibe-coding-templates（内容源）──────────────────────────────┐
│  rules-pack/                          ← 新增容器级目录（作者仓库，跑现有门禁）                  │
│    manifest.json                      ← 版本号 + 文件清单（目标路径/来源/内容摘要/可选特性）    │
│    global/AGENTS.md                   ← 全局常设规则文本                                       │
│    notes-skeleton/**                  ← 项目笔记骨架的每个文件                                 │
│    standing-orders-block.md           ← 追加进项目根 AGENTS.md 的规则块                        │
│    skills-optional/**                 ← 可选通用技能（SKILL.md 格式）                           │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
        │ 读取（本地路径 / git URL+tag），带内容摘要
        ▼
┌────────────────────────────── dsh-rules 插件（profile 级，host 层）──────────────────────┐
│  安装位置：~/.dsh/profiles/web/cordis.patch.yml insert（同 dsh-obsidian-bridge 先例）         │
│  职责：物化 + 幂等 + 迁移；写 ~/.dsh 等 host 文件不走会话文件沙箱                              │
│  工具（会话内可调）：dsh-rules init / status / upgrade / audit / install-global              │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
        │ 物化
        ├──► 全局：写 ~/.dsh/AGENTS.md、把选中技能复制到用户级技能根（记录已装版本+摘要）
        └──► 项目：生成 .agents/notes/ 骨架；在根 AGENTS.md 追加规则块（marker 包裹，幂等）
```

**为什么不把规则内容硬编码进插件**：容器与插件会双份漂移。插件只是“安装器/管理器”，内容一律来自**版本化规则包**；规则包随本仓库演进、门禁把关，插件按摘要比对决定“需要写入/更新/删除”的文件。

## 4. 规则包格式（草案）

`rules-pack/manifest.json`：

```json
{
  "version": "0.1.0",
  "files": [
    {
      "id": "global-standing-orders",
      "target": "~/.dsh/AGENTS.md",
      "source": "global/AGENTS.md",
      "sha256": "…",
      "overwrite": "merge-or-replace-by-marker"
    },
    {
      "id": "project-notes-readme",
      "target": ".agents/notes/README.md",
      "source": "notes-skeleton/README.md",
      "sha256": "…"
    },
    {
      "id": "project-notes-agents",
      "target": ".agents/notes/AGENTS.md",
      "source": "notes-skeleton/AGENTS.md",
      "sha256": "…"
    },
    {
      "id": "project-standing-orders-block",
      "target": "AGENTS.md",
      "source": "standing-orders-block.md",
      "mode": "append-under-marker"
    }
  ],
  "features": {
    "bilingualPairing": false,
    "docBudgets": false,
    "optionalSkills": ["…"]
  }
}
```

要点：
- **来源文件全部为本仓库新目录 `rules-pack/` 下的普通 md/json**，可走现有文档规范与评审；
- `sha256` 内容寻址：`status` 靠它报漂移，`upgrade` 靠它只改“规则包版本变化”的文件，绝不动项目自己写的笔记；
- **feature 开关**：默认“精简版”（无双语配对、无 doc-budget 门禁）——重机制留在容器自己的工具链；需要时开关物化对应文件。

## 5. 命令面（会话工具，草案）

| 工具/动作 | 作用对象 | 行为 | 幂等/安全 |
|---|---|---|---|
| `dsh-rules install-global` | 本机 DSH | 写/更新 `~/.dsh/AGENTS.md`；把选中技能放入用户级技能根 | 摘要比对后写入；保留用户对全局文件的既有编辑（marker 段替换） |
| `dsh-rules init` | 当前项目 | 生成 `.agents/notes/` 骨架；在根 `AGENTS.md` 追加规则块 | **绝不覆盖已有笔记**；检测到骨架外内容（旧复制残留）时报污染并给出隔离/删除/采用选项 |
| `dsh-rules status` | 当前项目 / 全局 | 报告：已装版本、漂移文件、污染项（容器开发史 note、dsh-* 冗余技能、未知文件） | 只读 |
| `dsh-rules upgrade` | 当前项目 / 全局 | 把规则包内容迁移到新版本 | 仅动规则包物化的文件；项目笔记只读校验 |
| `dsh-rules audit` | 当前项目 | 结构/链接校验（复用容器 verify 语义的子集；完整 doc-sync 仍归容器） | 只读 |

补充设计点：
- **项目定位**：与 agent-instructions 一致，用 `.git` 向上界定 projectRoot；无 git 时退回当前 cwd。
- **root AGENTS.md 追加**：以标记注释包裹（如 `<!-- dsh-rules:<entryId>:start -->…<!-- dsh-rules:<entryId>:end -->`），保证 `upgrade` 可定位、产品规则不被破坏；不要求双语。
- **污染识别规则（v1）**：notes 生命周期目录里出现 manifest 未声明、且文件名匹配容器历史命名（`2026-08-19-agents-at-repo-root` 等）即视为旧复制残留；`.agents/skills/` 下与内置同名（dsh-*）视为冗余。

## 6. 挂载与生命周期

- **本机 MVP**：`~/.dsh/profiles/web/cordis.patch.yml` 增加 insert（`id: dsh-rules`，`name: file://…/dsh-rules.mjs`），与现有 obsidian bridge 同机制；规则包路径经配置指向本仓库 checkout。
- **可分发形态（后续）**：包装为 profile 依赖的 npm 包（`~/.dsh/profiles/web/package.json` deps + 启动补丁），或贡献为 DSH 官方插件。
- **权限模型**：插件运行在 host 层，写 `~/.dsh` 与项目目录不经过会话文件沙箱（这是它优于“让 agent 用 fs 工具手动物化”的原因之一）；写项目内容前仍走“先展示差异、用户确认”流程。
- **待验证 API 面**（实现期核实）：第三方本地插件能否用 `@deepseek-ai/dsh-tools` 的 `defineTool` 注册会话工具、如何注册 GUI 菜单项；若工具注册不可用，回退方案＝插件只做 host 层物化 + 随包发一个用户可调用 skill 驱动 init/status 流程（同 dsh-translate-docs 的“用户显式调用”模式）。

## 7. 迁移路径

### 7.1 对已污染仓库（mandarin 等）
1. 运行 `dsh-rules init` → 检测到 25 篇容器开发史 note 与复制的 dsh-* 技能；
2. 交互式处置：开发史 note **隔离到 `imported-<date>/`**（或删除，不进入生命周期树）；技能目录清空冗余副本；
3. 写入新鲜骨架与根规则块；此后项目只写自己的笔记。

### 7.2 本仓库的消费契约变化（提案，另行评审）
- 根 `AGENTS.md` 的“复制 `.template/` + `.agents/`”指引**退役**，改为“安装 dsh-rules 插件”；
- `.template/` 保留为“需要自带文档门禁/双语配对的重度消费者”的选项，不再是默认路径；
- 容器自己的开发史 note 是否归档、`.agents/` 是否彻底退出复制面，沿用此前“笔记语料处置（暂缓）”的决策，本设计不替它拍板；
- 本仓库根布局约定（现为：入口 AGENTS + `.agents/` + Git 元数据）需扩展容纳 `rules-pack/` 与插件源码目录——实现前按容器自身规则（`2026-08-19-agents-at-repo-root` 等）评估并必要时以 note 记录——已记录为
   `.agents/notes/implemented/process/2026-09-03-dsh-rules-plugin-naming-and-rules-pack.md`。

## 8. 里程碑

| 阶段 | 内容 | 验收 |
|---|---|---|
| **M0 最小实验** | 手放 `~/.dsh/AGENTS.md` + 一个通用 skill，开新会话验证全局注入/技能出现 | 新会话基线含全局规则；技能目录出现 |
| **M1 本机 MVP** | 挂载本地插件；实现 `install-global` + `init`（规则包读本仓库 checkout）；对一个空项目跑通 | 项目只有骨架、根规则块生效；重跑幂等 |
| **M2 迁移与维护** | `status`/`upgrade`/`audit`；污染识别与隔离（对 mandarin 实测） | mandarin 干净化，升级不碰项目笔记 |
| **M3 可分发** | 规则包打 tag；插件包装 npm 包/官方化；文档 | 第二台机器/另一项目可一键安装 |

## 9. 明确不做（防蔓延）

- 不做规则内容的“新家”——内容唯一出处仍是本仓库；
- 默认不做双语配对 / doc-budget 物化（feature 开关外）；
- 不做容器门禁的运行时全量移植（audit 只覆盖插件物化面）；
- 不管理项目里非本插件物化的任意内容（只识别与报告）。

## 10. 待决问题（评审时定）

1.（已定案 2026-09-03）插件名与命令前缀：`dsh-rules`（命令形如 `dsh-rules init` / `status` / `upgrade` / `audit` / `install-global`）；规则包目录定名 `rules-pack/`。草案名 dsh-discipline / discipline-* 弃用；定案同步至入口文档与 Agent Note
   （`.agents/notes/implemented/process/2026-09-03-dsh-rules-plugin-naming-and-rules-pack.md`）。
2. 规则包目录放容器根还是新 repo；`.agents/` 退出复制面的时间点。
3. 全局规则块粒度：一句话指针（指向项目骨架 README）vs 内联完整规则（受 `~/.dsh/AGENTS.md` 字节预算约束，agent-instructions 有 maxBytes 上限）。
4. M0 是否先验证“全局规则 + 项目骨架”的注入次序与优先级是否符合预期。
