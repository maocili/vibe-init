# dsh-rules：需求与范围

> 状态：**定案 v1.0**（2026-09-03，M1b 决策补充于 2026-09-04）。本文档定义范围和可验收行为；如与
> 实现设计与架构取舍记录在
> [Agent Note：dsh-rules 实现设计](../.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md)；
> 本文只定义范围与可验收行为。

`dsh-rules` 是项目级初始化器，不是全局安装器。它从本仓库的 `rules-pack/` 物化项目受管面：根
`AGENTS.md` 规则段、`.agents/notes/` 骨架、默认技能副本和 `.dsh-rules/toolchain/`。它永不写入
`~/.dsh/AGENTS.md` 或用户技能根。

## 0. 决策基线

| 决策 | 定案 |
|---|---|
| D1 | 不做全局规则或全局技能安装。 |
| D2 | 每个项目显式初始化；挂载不改盘。 |
| D3 | `textLinkManagement` 与 `bilingualPairing` 默认开启。 |
| D4 | 双语骨架就绪不等于强制双语纪律。 |
| D5 | 所有随包技能默认以项目级、依赖包式副本安装；不覆盖用户自装或编辑过的技能。 |
| D6/D7 | 本文档是范围权威；实现细节与取舍记录在 Agent Note。 |
| D8 | 根规则块保持短小，以链接指向笔记骨架中的细则。 |
| D9 | `bilingualDocsDiscipline` 独立于双语骨架，默认关闭。 |
| D10 | `docBudgets` 默认开启。 |
| D11 | `docGates` 是默认开启的工具链伞；`docGatesExtras` 默认关闭；各纪律特性各有脚本组。 |
| D12 | 工具链落在项目 `.dsh-rules/toolchain/`；双语组随双语纪律开启；挂钩随伞安装；作者测试链不随包。 |

## 1. 目标

旧的整棵模板复制会让规则不在会话基线、已复制内容漂移，并把容器开发史带进下游项目。插件以可审计的
受管副本取代复制：规则正文只在 `rules-pack/` 维护，项目只得到新鲜骨架和选定的受管内容。

## 2. 行为契约

| 需求 | 契约 |
|---|---|
| R1 | `init`/`upgrade` 只对一个项目物化受管面。 |
| R2 | 所有命令都不改全局面。 |
| R3 | manifest 声明的全部技能复制到项目 `.agents/skills/`；用户编辑产生冲突而不覆盖。 |
| R4 | 只物化新鲜骨架、规则段、声明的技能和工具链；历史与作者专用物不进入项目。 |
| R5 | 规则与技能正文的唯一版本化来源是 `rules-pack/`；规则行位于 `manifest.files`，技能资产位于 `manifest.skills`，两者都以 sha256 寻址。 |
| R6 | 不覆盖笔记、段外内容或用户自装内容；冲突应报告而非静默覆盖。 |
| R7 | 对同一规则包重复运行字节稳定，并报告无变更。 |
| R8 | `status`/`audit` 只读报告受管状态、漂移和旧残留。 |
| R9 | `upgrade` 只更新变化的受管内容；关闭特性只移除未被用户改动的副本。 |
| R10 | 插件加载无副作用；物化始终由显式命令触发。 |

## 3. 物化范围与默认值

| 项目落点 | 默认内容 |
|---|---|
| `AGENTS.md` | Agent Note、文本链接和文档预算 marker 段 |
| `.agents/notes/` | README 三件套、门规、manifest 与四象限目录 |
| `.agents/skills/` | manifest 声明的全部项目级 skill 副本 |
| `docs/AGENTS.md` | 文档分层、篇幅目标与预算门禁规范（由 `docBudgets` 管理） |
| `.dsh-rules/toolchain/` | docGates scaffold、默认门禁、挂钩与组装的 `package.json` |

| Feature | 默认 | 作用 |
|---|---:|---|
| `textLinkManagement` | 开 | 根规则段与链接校验组 |
| `bilingualPairing` | 开 | 笔记 README 双语三件套 |
| `bilingualDocsDiscipline` | 关 | 根双语规则段与双语工具组 |
| `docBudgets` | 开 | 根预算规则段与预算工具组 |
| `docGates` | 开 | 受管工具链伞 |
| `docGatesExtras` | 关 | 折行、Mermaid 和技能调用等重门禁 |

不进入项目：容器历史笔记、作者/容器专用内容、完整 Vitest 测试链，以及未被规则包声明的文件。

## 4. 边界与未决项

插件可以计划、物化、升级、移除受管副本并报告状态；用户拥有业务代码、笔记正文、根文件段外内容和
自装技能。所有写入先显示差异并取得确认（或以 `--yes` 明确执行）。

仍待决定：DP-F（可分发技能清单）、DP-G（自装技能识别口径）和 M3（可分发形态）。
