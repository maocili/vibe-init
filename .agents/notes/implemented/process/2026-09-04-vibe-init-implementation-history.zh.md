# Agent Note: vibe-init 实现历史

Status: implemented

## Problem

决策级历史曾单独放在 `docs/` 下的变更日志中，与 Agent Note 纪律分离。这使理由和替代方案更难查找，也容易让 CHANGELOG 变成第二套架构事实来源。

## Decision

决策历史在此维护为精简时间线；细粒度变更以 Git 为准：

- **2026-09-03 — v1.0：** 范围确定为显式的项目级初始化器，退役全局安装；建立 marker 规则段、笔记骨架、内容寻址、冲突保护、幂等升级、状态和审计。
- **2026-09-04 — M1b：** `docGates` 成为受管的项目工具链。`spec.json` 声明 scaffold、hooks、base、text-link、doc-budget、bilingual 和 extras 分组；启用分组会被物化，并确定性组装消费者 `package.json`。
- **2026-09-04 — 仓库与文档收敛：** 源码移到仓库根，项目文档集中到 `docs/`，根 README 成为使用者入口。随后将设计和历史移入 Agent Notes，使 docs 只保留稳定契约和证据页面。
- **2026-09-05 — 历史 M3 宿主分发：** `@maocili/dsh-vibe` 以 DSH bundle 和 Cordis plugin 分发，并包含宿主打包和挂载覆盖。这是历史事实，不是当前产品表面。
- **2026-09-06 — 独立硬切：** 移除宿主分发。当前包为 `@maocili/vibe-init`，只提供 `vibe-init` CLI，拥有 `.vibe-init/` 和 schema 2 状态；旧命名空间不被发现或迁移。

当前架构和移除理由记录在[实现设计 Note](../architecture/2026-09-04-vibe-init-implementation-design.md)和[独立硬切 Note](../simplification/2026-09-06-standalone-vibe-init.md)中。

## Alternatives considered

**保留常规的 `docs/CHANGELOG.md`。** 习惯上易于理解，但会把历史与决策记录分开，也无法要求 Agent Note 的理由格式。

**把每次提交都记录在本笔记中。** 这会重复 Git 并制造噪声；这里只记录里程碑和决策。

**完全删除历史。** 这会丢失理解范围边界和待办所需的上下文，因此保留精简的里程碑记录。

## Consequences

原 CHANGELOG 现在只保留指向本笔记的指针。今后的里程碑或范围变更须在同一变更中更新本笔记及中文副本；细粒度文件历史明确交由 Git 维护。
