# Agent Note: dsh-vibe 实现设计

Status: implemented

## Problem

实现机制和设计取舍曾混在面向使用者的文档中，容易把会变化的工程说明误当成稳定契约，也容易在后续修改时
重复记录或与需求产生矛盾。

## Decision

实现采用确定性的 plan → evaluate → apply 流程。`packages/` 是规则与技能内容唯一的版本化来源；
`manifest.json` 记录特性默认值、工具链分组、文件目标和内容摘要。引擎写入带 marker 的规则段、全新的笔记骨架、
选定技能，并管理项目工具链；用户改动过的内容保留并报告为冲突。重复执行会收敛为无写入，`status`/`audit`
复用同一只读计划。

Cordis 入口只校验规则包并报告插件已挂载；项目写入由显式 CLI 命令完成。项目边界是永久约束：任何命令都不安装或
更新用户全局的 `~/.dsh/` 面。

可分发形态确定为公共 npm 包 `@maocili/dsh-vibe`。包 manifest 声明指向包内 `cordis.patch.yml` 的
`dsh.bundle.patch`；DSH profile 安装 bundle 后，该 patch 将同包作为 Cordis plugin 插入。npm `files` 白名单只携带
运行时、CLI、patch 和 `packages/`；绝对 `file://` 条目仅保留为 checkout 开发回退。

原设计文档现在只保留指针；本笔记负责承载实现决策及其理由。稳定范围和行为见
[`REQUIREMENTS`](../../../../docs/REQUIREMENTS-dsh-vibe-plugin.md)，证据见
[`ACCEPTANCE`](../../../../docs/ACCEPTANCE.md)。

## Alternatives considered

**保留 `docs/DESIGN` 中的机制说明。** 维护者查阅方便，但设计事实会与规范性需求并列，并诱发第二套决策历史。

**把所有实现细节并入 `REQUIREMENTS`。** 这会让契约难以评审，并混淆用户可依赖的行为与当前实现方式。

**只使用提交信息。** Git 历史适合追溯，却不够可发现、不可交叉链接，也不会记录被否决的替代方案。

**发布没有 bundle 元数据的普通插件包。** 模块虽然可安装，但 DSH profile 无法发现它的 patch 层；因此包声明宿主的
bundle 契约，并拥有最小的自插入 patch。

**继续以绝对 file URL 作为分发路径。** 这适用于 checkout，却会把 profile 状态绑定到单机路径，无法由包管理器消费；
因此只保留为本地开发回退。

## Consequences

今后的架构或实现变更须在同一变更中更新本笔记及中文副本。公共文档链接到这里，不再复制机制说明。修改规则包
manifest、物化语义、冲突策略或挂载行为时，必须同步保持实现测试和验收证据一致。包 manifest、bundle patch、tarball 文件清单
和 package consumer smoke test 是 M3 分发契约的事实来源。
