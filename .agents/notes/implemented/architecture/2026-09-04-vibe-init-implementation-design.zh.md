# Agent Note: vibe-init 实现设计

Status: implemented

## Problem

实现机制和设计取舍曾混在面向使用者的文档中，容易把会变化的工程说明误当成稳定契约，也容易在后续修改时重复记录或与需求产生矛盾。

## Decision

`@maocili/vibe-init` 是独立 CLI 初始化器，不提供模块、plugin、bundle 或宿主挂载表面。CLI 对外提供 `vibe-init` 二进制，只负责项目本地 `.vibe-init/` 下的初始化和升级；它不会发现、迁移或删除旧的 `.dsh-vibe/` 命名空间及其 `dsh-vibe:*` marker。新状态使用 `schemaVersion: 2`。

实现采用确定性的 `plan` → `evaluate` → `apply` 流程。`packages/` 是规则、笔记骨架、技能、特性和工具链内容唯一的版本化来源；`manifest.json` 记录特性默认值、工具链分组、文件目标和内容摘要。manifest 中的每个 source、行 target、工具链 spec/target 以及工具链分组 source 都在 pack 读盘前使用同一安全相对路径规则。随后，一个异步的 `lstat`/`realpath` 包含性检查会对照 pack 的真实根验证每个现存 pack source 和递归枚举的资产，并对照所选项目的真实根验证每个计划、评估、应用、删除、安装或状态目标。调用方可以通过指向项目根的符号链接选择仓库，但任何后代符号链接都不得通向该真实根之外。这些检查会拒绝预先存在的符号链接逃逸，但不声称能在并发替换路径时提供无竞态的文件系统事务。无效 pack 条目会被排除，写入命令在计划前失败；只读命令不会物化不安全条目。manifest 中每个文件行声明的 `sha256` 必须与加载到的 source 摘要相等，与技能资产的规则一致；安全 source 的摘要漂移会阻止 `init` 和 `upgrade`，仍可由 `hash` 刷新，并在刷新后达到零漂移。引擎写入带 marker 的规则段、全新的笔记和选定技能，并管理项目工具链；用户改动过的内容保留并报告为冲突。重复执行会收敛为无写入，`status`/`audit` 复用同一只读计划。

`upgrade` 按所有权迁移。marker 段、生成文档、声明的工具链文件、声明的技能文件和笔记骨架说明文件由工具拥有，可刷新同步；日期命名的 Agent Note、笔记 manifest、业务文档和未知文件仍由项目拥有。只有状态确认拥有且当前内容仍匹配安装哈希的受管旧文件才会删除；修改或归属不明的路径保留并报告冲突。工具链依赖安装成功后才原子提交状态。

原独立设计文档现在只保留指针；本笔记负责实现决策及其理由。稳定范围和行为见 [`REQUIREMENTS`](../../../../docs/REQUIREMENTS-vibe-init.md)，证据见 [`ACCEPTANCE`](../../../../docs/ACCEPTANCE.md)，移除决策见[独立硬切 Note](../simplification/2026-09-06-standalone-vibe-init.zh.md)。

## Alternatives considered

**保留公共设计页中的机制说明。** 维护者查阅方便，但可变设计事实会与规范性需求并列，并诱发第二套决策历史。

**把所有实现细节并入 `REQUIREMENTS`。** 这会让契约难以评审，并混淆用户可依赖的行为与当前实现方式。

**只使用提交信息。** Git 历史适合追溯，却不够可发现、不可交叉链接，也不会记录被否决的替代方案。

**保留宿主 plugin、bundle 和 profile adapter。** 早期实现曾使用 `@maocili/dsh-vibe`、DSH bundle 和 Cordis plugin，但这些表面不参与项目计划或应用。独立硬切移除了发布耦合；宿主集成是否重引入仍需单独证明，理由和重引入条件保留在[独立硬切 Note](../simplification/2026-09-06-standalone-vibe-init.zh.md)中。

**继续以绝对 file URL 作为分发路径。** 这适用于 checkout，却会把安装绑定到单机路径，无法由包管理器消费；因此只作为历史性的本地开发替代方案保留。

## Consequences

今后的架构或实现变更须在同一变更中更新本笔记及中文副本。公共文档链接到这里，不再复制机制说明。修改规则包 manifest、物化语义、冲突策略、命名空间或所有权策略时，必须同步保持实现测试和验收证据一致。包 manifest、CLI package check、状态格式和所有权测试是独立分发与项目本地迁移契约的事实来源。Markdown 链接校验把 `packages/README.md` 视为仓库自有文档；规范包模板只在物化根（`AGENTS.md`、`docs/`、`.agents/` 和 `.vibe-init/toolchain/`）校验。
