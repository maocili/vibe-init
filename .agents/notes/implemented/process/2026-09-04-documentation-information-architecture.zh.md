# Agent Note: 文档信息架构

Status: implemented

## Problem

根 README、docs 索引、需求和设计文档曾重复初始化器状态、命令面、范围边界与仓库布局。重复文字使公共入口变长，也让小改动容易留下互相矛盾的路径或过期测试数量。

## Decision

根 README 是精简的使用者入口：安装独立 CLI、初始化项目、选择特性并运行测试。`docs/README.md` 仅负责导航。REQUIREMENTS 保留范围契约和默认值；ACCEPTANCE 保留证据；实现设计和决策级历史放在链接到的 Agent Note 中。每个事实只有一个主要归属，其它位置用链接而不是复制说明。

当前文档使用初始化器拥有的 `.vibe-init/`、`vibe-init:*` 和 `.vibe-init/schema2` 语义；旧 `.dsh-vibe/` 命名空间既不被发现也不被迁移。移除决策与所有权边界分别见[独立硬切 Note](../simplification/2026-09-06-standalone-vibe-init.zh.md)和[Upgrade 所有权迁移 Note](2026-09-04-upgrade-ownership-migration.zh.md)。

## Alternatives considered

**让每份文档都自洽。** 不需要跳转，但会在多处复制命令面和状态，重现导致本次调整的漂移问题。

**把所有细节放进根 README。** 首次阅读方便，却会把规范性和维护者材料埋进操作指南。

## Consequences

今后的使用者变化先改根 README，契约变化改 REQUIREMENTS，证据变化改 ACCEPTANCE，架构或历史变化改对应 Agent Note。改变这些边界的文档调整应更新事实归属处，而不是在别处复制同一段文字。
