# vibe-init：需求与范围

> 状态：**定案 v1.0**（2026-09-03，M1b 决策补充于 2026-09-04）。本文档定义范围和可验收行为；如与实现细节或架构取舍冲突，以[实现设计 Agent Note](../.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md)为准；本文只定义范围与可验收行为。

`vibe-init` 是独立的项目级 CLI 初始化器，不是模块或 plugin，也不是全局安装器。它从本仓库的 `packages/` 物化项目受管面：根 `AGENTS.md` 规则段、`.agents/notes/` 骨架、默认技能副本和 `.vibe-init/toolchain/`。它永不写入用户全局配置或用户技能根。

## 0. 决策基线

| 决策 | 定案 |
|---|---|
| D1 | 不做全局规则或全局技能安装。 |
| D2 | 每个项目显式初始化；standalone CLI 安装不物化项目内容。 |
| D3 | `textLinkManagement` 与 `bilingualPairing` 默认开启。 |
| D4 | 双语骨架就绪不等于强制双语纪律。 |
| D5 | 所有随包技能默认以项目级、依赖包式副本安装；`init` 对用户编辑报告冲突，`upgrade` 按受管清单同步规则包版本；技能目录中的用户新增文件始终保留。 |
| D6/D7 | 本文档是范围权威；实现细节与取舍记录在 Agent Note。 |
| D8 | 根规则块保持短小，以链接指向笔记骨架中的细则。 |
| D9 | `bilingualDocsDiscipline` 独立于双语骨架，默认关闭。 |
| D10 | `docBudgets` 默认开启。 |
| D11 | `docGates` 是默认开启的工具链伞；`docGatesExtras` 默认关闭；各纪律特性各有脚本组。 |
| D12 | 工具链落在项目 `.vibe-init/toolchain/`；双语组随双语纪律开启；挂钩随伞安装；作者测试链不随包。 |
| D13 | `upgrade` 依据项目 `.vibe-init/state.json` 做所有权迁移；规则/生成文档/声明的工具链与技能可覆盖同步，Agent Note 正文、业务文档和未知文件不可覆盖；状态仅在文件迁移与依赖安装均成功后原子提交。 |
| D14 | 当前 namespace 为 `.vibe-init/`、`vibe-init:*` 和 schema 2；旧 `.dsh-vibe/`、`dsh-vibe:*` 与旧环境变量不被发现、迁移、修改或删除。 |

## 1. 目标

旧的整棵模板复制会让规则不在会话基线、已复制内容漂移，并把容器开发史带进下游项目。初始化器以可审计的受管副本取代复制：规则正文只在 `packages/` 维护，项目只得到新鲜骨架和选定的受管内容。

## 2. 行为契约

| 需求 | 契约 |
|---|---|
| R1 | `init`/`upgrade` 只对一个项目物化受管面。 |
| R2 | 所有命令都不改全局面。 |
| R3 | manifest 声明的全部技能复制到项目 `.agents/skills/`；`init` 对用户编辑报告冲突，`upgrade` 覆盖规则包声明的技能文件，但保留技能目录中的用户新增文件。 |
| R4 | 只物化新鲜骨架、规则段、声明的技能和工具链；历史与作者专用物不进入项目。 |
| R5 | 规则与技能正文的唯一版本化来源是 `packages/`；规则行位于 `manifest.files`，技能资产位于 `manifest.skills`，两者都以 sha256 寻址。 |
| R6 | 不覆盖 Agent Note 正文、根 marker 段外内容、业务文档或用户自装内容；冲突应报告而非静默覆盖。 |
| R7 | 对同一规则包重复运行字节稳定，并报告无变更。 |
| R8 | `status`/`audit` 只读报告受管状态、漂移和旧命名空间残留。 |
| R9 | `upgrade` 按所有权分类更新受管内容；关闭特性或清单移除只删除状态确认且仍等于上次安装哈希的旧副本，用户修改或无法确认归属的路径保留并报告冲突。 |
| R10 | CLI 安装无项目写入；物化始终由显式命令触发。 |
| R11 | `upgrade` 必须先生成 dry-run 分类预览；非交互写入必须显式 `--yes`，无确认不写盘。 |
| R12 | 项目级 `state.json` 记录 schema、packVersion、feature 配置、marker 和受管文件源/安装哈希；工具链 package 或依赖集合变化时执行 `pnpm -C .vibe-init/toolchain install`，失败返回非零且不提交新状态。 |

## 3. 物化范围与默认值

| 项目落点 | 默认内容 |
|---|---|
| `AGENTS.md` | Agent Note、文本链接和文档预算 marker 段 |
| `.agents/notes/` | README 三件套、门规、manifest 与四象限目录 |
| `.agents/skills/` | manifest 声明的全部项目级 skill 副本 |
| `docs/AGENTS.md` | 文档分层、篇幅目标与预算门禁规范（由 `docBudgets` 管理） |
| `.vibe-init/toolchain/` | docGates scaffold、默认门禁、挂钩与组装的 `package.json` |

| Feature | 默认 | 作用 |
|---|---:|---|
| `textLinkManagement` | 开 | 根规则段与链接校验组 |
| `bilingualPairing` | 开 | 笔记 README 双语三件套 |
| `bilingualDocsDiscipline` | 关 | 根双语规则段与双语工具组 |
| `docBudgets` | 开 | 根预算规则段与预算工具组 |
| `docGates` | 开 | 受管工具链伞 |
| `docGatesExtras` | 关 | 折行、Mermaid 和技能调用等重门禁 |

不进入项目：容器历史笔记、作者/容器专用内容、完整测试链，以及未被规则包声明的文件。

## 4. `upgrade` 所有权迁移边界

`upgrade` 的受管矩阵如下：

| 内容 | 升级行为 |
|---|---|
| 根 `AGENTS.md` marker 段 | 只更新 marker 内部正文；段外不变；缺失可补建，重复/损坏报告冲突 |
| `docs/AGENTS.md` | 初始化器生成文档，规则包变化时覆盖 |
| `.vibe-init/toolchain/**` 声明文件 | 覆盖同步；未声明的用户新增文件保留 |
| `.agents/skills/<name>/` 声明文件 | 覆盖同步；技能目录中的用户新增文件保留 |
| `.agents/notes/` README/AGENTS 说明文件 | 可随规则包更新 |
| `.agents/notes/` 日期命名 Note、`manifest.json` 与用户文件 | 永不创建、更新或删除 |
| 业务 `docs/**`（不含 `docs/AGENTS.md`） | 永不修改 |

旧 `.dsh-vibe/` 命名空间和 `dsh-vibe:*` marker 不被发现、迁移、修改或删除；不存在兼容迁移命令或旧状态输入路径。

## 5. 边界与未决项

初始化器可以计划、物化、升级、移除受管副本并报告状态；用户拥有业务代码、笔记正文、根文件段外内容和自装技能。所有写入先显示差异并取得确认（或以 `--yes` 明确执行），不新增自动备份目录，回滚依赖 Git。

DP-G（自装技能识别口径）仍待决定。当前安装方式是 standalone `@maocili/vibe-init` CLI；包只提供 `vibe-init` 二进制，不提供 DSH bundle、Cordis plugin 或 profile 安装路径。随包技能清单（DP-F）已由 `packages/manifest.json` 固化并默认安装。
