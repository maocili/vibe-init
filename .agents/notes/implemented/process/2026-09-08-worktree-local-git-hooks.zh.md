# Agent Note: 工作树本地 Git 钩子

Status: implemented

## Problem

消费者工具链此前通过 Git 默认钩子目录安装一个仓库级 pre-commit 文档门禁。它没有区分针对性本地证据、钩子检查点与 CI 覆盖，关联工作树也可能相互覆盖生成的钩子启动器。已有 hook path、并发安装及 Lefthook 进程失败同样缺少所有权保护和回滚。

## Decision

受管根指令要求通过可移植的 `pre-push-checks` skill，选择覆盖完整待推送改动的最小项目声明证据。钩子保持更窄：pre-commit 检查已暂存空白及适用的归档或双语配对完整性，pre-merge 重复完整性检查，pre-push 运行已配置的文档聚合门禁。消费者项目提供 CI 时，全量和平台矩阵覆盖仍由 CI 负责。

消费者 postinstall 根据已启用的工具链脚本生成 `lefthook.yml`，且只有文件首行 marker 能证明 vibe-init 所有权时才刷新。外来或非普通配置文件永不覆盖。每个工作树都在自身 Git 目录下获得绝对钩子目录和工作树作用域的 `core.hooksPath`；安装器只有在拒绝休眠设置和不支持的仓库状态后才启用 Git 工作树配置。继承的自定义 hook path 需要设置 `VIBE_INIT_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE=1`，并且只在当前工作树中遮蔽该路径。命令作用域和自定义工作树作用域路径永不替换。

所有权记录保护保留的钩子目录，common Git 目录中的 PID/UUID 锁负责串行化安装。陈旧或格式错误的锁必须显式恢复。安装器会从 Lefthook 环境中移除命令作用域 Git 配置，并在 Lefthook 失败时回滚当前工作树 hook path 和生成配置。安全的仓库格式与工作树扩展迁移是单调操作，不执行回退。关闭 `docGates` 时继续沿用现有的手动钩子清理语义。

## Alternatives considered

**在 pre-commit 中运行所有可用检查。** 这能更早反馈，却让每次提交承担无关的仓库级工作，并重复 CI 证据。

**使用 common Git hooks 目录。** 这种方式更简单，但一个关联工作树可能安装引用另一工作树文件和依赖的启动器。

**自动替换已有 hook path。** 这会让安装更方便，却可能静默丢弃用户拥有的钩子行为。显式的当前工作树覆盖既保留意图，也不改变同级工作树。

**自动删除陈旧锁和未知钩子目录。** 进程标识符可能被复用，未知文件也可能属于用户，因此无法证明所有权时仍要求显式恢复。

## Consequences

初始化后的项目会获得可预测的本地检查点，而不会把钩子当作完整验证。钩子安装可能把非裸仓库升级到 Git repository format 1 并启用 `extensions.worktreeConfig`；后续安装保持隔离和幂等。使用外来 Lefthook 配置的消费者必须自行合并打印出的 jobs。安装器和生成配置仍是受管规则包内容，因此变更必须刷新 manifest 哈希，并通过基于真实临时 Git 工作树的集成测试。
