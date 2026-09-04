# dsh-rules toolchain（门禁与双语工具链）

本目录是 dsh-rules 为每个项目物化的**受管工具链**（manifest `toolchain` → `docGates` 特性，缺省随 `init`/旧项目 `upgrade` 安装），
语料从 `../vibe-coding-templates/.template` 提炼（迁移记录见仓库 CHANGELOG / ACCEPTANCE）。它是插件受管副本：
`status` 逐文件报 ok/drift/conflict，`upgrade` 按版本迁移，**请勿直接改这里**——本地改动会在下次 `status`/`upgrade` 报 conflict。

## 前置

- Node >= 20 与 pnpm；项目含 `.agents/notes/`（`dsh-rules init` 已生成）。
- 门禁以**项目根**为扫描根（含 `.agents` 的目录），作用于项目 README/AGENTS.md/`docs/**`/`.agents/notes|skills`。

## 用法

```sh
cd <project>
pnpm -C .dsh-rules/toolchain install   # 会触发 postinstall：安装 pre-commit 挂钩（见下）
pnpm -C .dsh-rules/toolchain run doc-sync
```

- `doc-sync` = 按已启用门禁组串联 `verify-*`（组由 manifest features 决定，见 `spec.json`）。
- 特性开关：`dsh-rules init --feature bilingualDocsDiscipline=true`（装双语门禁+工具链+语料）、
  `--feature docGatesExtras=true`（mermaid/技能元数据重门禁）、`--feature docGates=false`（移除整个工具链目录）。
- pre-commit 挂钩：`install-lefthook.mjs`（postinstall 触发）在 git 根写入 `lefthook.yml`（含 dsh-rules 标记）并执行 `lefthook install`；
  项目已有 `lefthook.yml` 且不含本工具标记时**报冲突不覆盖**；删除 `lefthook.yml` 与 .git/hooks 对应项即可卸载。

## 门禁组 → 脚本

| 组/特性（默认） | 门禁 | 说明 |
|---|---|---|
| `docGates` 伞（true） | verify-agent-note-format / -classification / verify-archived-agent-notes | note 纪律（.agents/notes 生命周期/格式/归档冻结） |
| `docGates` 伞（true） | verify-doc-refs | ts 注释中的 docs 引用校验 |
| `textLinkManagement`（true） | verify-md-links | 相对链接/锚点完整性 |
| `docBudgets`（true） | verify-doc-budgets | `scripts/doc-budgets.manifest.json` 字数预算（默认只预算根 AGENTS.md；新增档位在清单里加行，路径相对项目根） |
| `bilingualDocsDiscipline`（false） | verify-translation-pairing、doc-typecheck + gen-translation-brief / resolve-translation-pairing-conflicts | 双语配对一致性（git blob 记录）+ 文档 ts 围栏类型检查；语料在 `docs/i18n/`（terminology/translation-rules/style-samples/translation-prompt） |
| `docGatesExtras`（false） | verify-md-wrap / verify-mermaid / verify-skill-invocation-metadata | 逐段单物理行折行纪律（默认关：本插件物化的中文规则文本按段落折行，默认态需自洽；需要严格一物理行一行的仓库开启）+ 重门禁（jsdom+mermaid；技能元数据 js-yaml） |

## 与源容器（vibe-coding-templates/.template）的蒸馏差异

- 门禁扫描根 = **项目根**（`agentCorpusRoot()`），非"脚本所在目录的上级"；TS 门禁的 `root` 同理。
- 数据/语料路径指向工具链本目录（doc-budgets manifest、translation-pairing manifest、docs/i18n 语料、doc-typecheck 的 tsconfig/临时目录/tsc 执行）。
- `*.spec.ts`、test-fixture-cleanup（vitest 开发物）、作者向 translation-prompt/merge driver 系列与 lefthook 全量安装器**未随迁**（T4 留在源仓库）；`install-lefthook.mjs` 为消费者向蒸馏版。
- 源容器后续改动不自动同步：规则以本目录为唯一版本化出处，需要时按上文差异手动提炼并跑 `cd plugin && pnpm test` 锁定。
