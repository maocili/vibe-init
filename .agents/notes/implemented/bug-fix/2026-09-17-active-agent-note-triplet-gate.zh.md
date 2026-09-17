# Agent Note: active Agent Note 三件套门禁

Status: implemented

## Problem

文档聚合门禁会验证 active Agent Note 的结构和 archived Note 的三件套，但不会要求 active Note
同时具备两种语言文件和最新的一致性 sidecar。因此，孤立的英文或中文 Note，或过期的 sidecar，
都可能通过 `doc-sync`，直到归档操作暴露出不完整的三件套后才被发现。

## Decision

只要项目状态与受管 Note README 声明启用双语配对，默认 Agent Note 格式门禁
就同时验证 active 双语三件套。`proposed/`、`implemented/` 和 `rejected/` 下的每篇 Note 都必须有
`.md`、`.zh.md` 和 `.i18n.yaml` 三个同名文件。sidecar 必须且只能列出两种语言文件，并记录两者
当前的 Git blob hash。没有英文源文件的本地化文件或 sidecar 会被判定为孤儿文件。

该检查属于基础 `docGates` 组，因为 Agent Note 配对由独立且默认开启的 `bilingualPairing` 特性
控制，而不依赖可选的仓库级 `bilingualDocsDiscipline` 门禁。没有根配对 sidecar 的语料仍保留
受支持的纯英文行为。

## Alternatives considered

**把 active Note 纳入仓库级翻译配对门禁。** 该门禁是可选项，并采用范围更广的文档契约；让
Note 合规性依赖它，会使默认配置继续缺少保护，也会混淆两个彼此独立的特性。

**只在归档时检查完整性。** 这会保留现有实现，却允许无效的 active 记录通过每一次日常文档
检查，正是本次需要补上的盲区。

**无条件要求三件套。** 项目可以显式关闭 `bilingualPairing`；此时仍要求对侧文件会违背受支持
的纯英文 Note 语料约定。

## Consequences

现在，只要 active 双语 Note 不完整、存在孤儿文件，或内容变更后未刷新 sidecar，`doc-sync` 就会
立即失败。门禁只使用 Node.js 内置 API，因此仍可在默认工具链中运行。回归测试覆盖缺少同名文件、
有效三件套和记录 hash 过期三种情况。
