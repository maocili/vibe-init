# vibe-init 文档

根 [`README.md`](../README.md) 面向使用者：安装独立 CLI、初始化项目和日常命令。这里保留维护者需要的权威文档，避免再复制命令说明或当前状态。

| 文档 | 用途 |
|---|---|
| [REQUIREMENTS](REQUIREMENTS-vibe-init.md) | 定案的范围、行为契约、默认值与非目标 |
| [AGENTS.md](AGENTS.md) | 文档分层、篇幅目标与预算门禁规范 |
| [ACCEPTANCE](ACCEPTANCE.md) | 每项需求和决策对应的代码、测试或实测证据 |
| [实现设计 Agent Note](../.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md) | 物化引擎、规则包和工具链的实现取舍 |
| [实现历史 Agent Note](../.agents/notes/implemented/process/2026-09-04-vibe-init-implementation-history.md) | 决策级里程碑；细粒度历史以 Git 为准 |
| [Upgrade 所有权迁移 Agent Note](../.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) | state、覆盖与遗留清理边界 |
| [独立硬切 Agent Note](../.agents/notes/implemented/simplification/2026-09-06-standalone-vibe-init.md) | standalone CLI 决策、失去的能力与兼容边界 |

历史入口页仍可访问：[CHANGELOG 指针页](CHANGELOG.md)。

仓库入口与会话规则见 [`../AGENTS.md`](../AGENTS.md)，规则包的内容映射见 [`../packages/README.md`](../packages/README.md)。
