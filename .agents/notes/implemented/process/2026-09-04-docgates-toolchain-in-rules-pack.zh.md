# Agent Note: docGates 工具链迁移进 rules-pack

Status: implemented — M1b 于 2026-09-04 交付（REQUIREMENTS D11/D12）

## Problem

容器的可运行 doc-gate 工具链（verify-* ts 脚本、双语配对工具、pre-commit 挂钩）只存在于 `../vibe-coding-templates/.template` 与本仓库 `.template/` 的开发副本里。REQUIREMENTS v1.0 明确砍掉了门禁运行时移植——dsh-rules 初始化的消费者项目只拿到规则文本（段、notes 骨架、特性），没有任何可执行物，纪律无机械校验。

## Decision

把必要工具链迁入 `rules-pack/`，按 feature 物化到每个消费者项目。

- 新增 `rules-pack/toolchain/` + `manifest.toolchain` + `toolchain/spec.json`：7 组（scaffold/hooks/base/text-link/doc-budgets/bilingual/extras）声明文件、npm scripts 与 devDeps。伞特性 `docGates`（默认 true）门控 scaffold/常设 note 门禁/T3 lefthook 挂钩；`textLinkManagement`/`docBudgets`/`bilingualDocsDiscipline`/`docGatesExtras` 门控各自的脚本组（每 feature 配脚本，方案甲）。物化到 `.dsh-rules/toolchain/`；引擎按启用组确定性组装 `package.json`（doc-sync = 已装 verify 链），关闭组/伞移除受管副本——字节等于源才删，用户改动保留（conflict），`--force` 可强制。

- 蒸馏差异：门禁扫描根 = 项目根（`agentCorpusRoot()`，含 `.agents` 的目录），不再是脚本父目录；数据/语料路径（doc-budgets manifest、translation-pairing manifest、`docs/i18n/` 语料、doc-typecheck 的 tsconfig/临时目录/tsc）指向工具链本目录；`*.spec.ts`/test-fixture-cleanup（T4，vitest）与作者向工具留在源仓库。

- 自洽修正（默认物化态要能通过自身门禁）：`verify-md-wrap` 移入 `docGatesExtras`（opt-in——逐段单物理行门禁与按段落折行的中文规则文本冲突）；双语配对 scope 排除 `.agents/notes/**`（notes 双语可选，由 note 门禁负责）；notes 骨架补齐 archived 六类目录 + 基线 manifest，并给 README 三件套写入有效 pairing record。

## Alternatives considered

- **单一整包工具链特性（方案乙）**——拒绝：双语/重门禁未开时默认消费者也得背 jsdom/mermaid/typescript；每 feature 门控（方案甲，采纳）默认装得轻，且匹配『每个 discipline feature 有自己的脚本支撑』。

- **`verify-md-wrap` 默认开并重排全部规则正文为单物理行**——拒绝：与中文/英文规则文本按段落折行的写作风格冲突；作为 opt-in 严格门禁更诚实。

- **notes 强制容器式双语配对**——拒绝：dsh-rules 的 notes 默认双语可选；蒸馏后的配对门禁只管 docs/README/contributing 产品配对。

- **照搬容器 846 行 lefthook 安装器（T4 式）**——拒绝：消费者拿到薄蒸馏版安装器，写带标记的 `lefthook.yml`，绝不覆盖外来配置。

## Consequences

- 消费者项目获得可运行门禁：新项目默认 `doc-sync` 与 bilingual 全链均 exit 0；工具链内 `pnpm install` 触发 postinstall 写入 pre-commit 挂钩。

- `--feature` 覆盖保持按次生效（不持久化）；feature 默认以 manifest 为准，`docGates=false` 一次运行即移除整个工具链。持久化留待后续。

- 引擎测试由 17 增至 26（toolchain 物化/移除、audit 感知、CLI 端到端）；REQUIREMENTS/DESIGN/README/ACCEPTANCE 与特性正文同步为受管工具链口径。

- 消费前置 Node>=20 + pnpm（源形态运行时；消费者自跑 `pnpm install`，不随装依赖/锁文件）。
