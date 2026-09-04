# Changelog

## 2026-09-04 — M1b: docGates 门禁/双语/挂钩工具链迁入 rules-pack（REQUIREMENTS D11/D12）

### feat(rules-pack): toolchain subtree + spec + manifest 声明
- rules-pack/toolchain/：spec.json 声明 7 组（scaffold/hooks/base/text-link/doc-budgets/bilingual/extras）与依赖/scripts；
- 蒸馏自 ../vibe-coding-templates/.template：note/链接/预算/doc-refs 门禁、双语配对门禁+生成工具+docs/i18n 语料、消费者向 install-lefthook.mjs（T3）；
- 蒸馏差异：门禁扫描根 = 项目根（agentCorpusRoot）；manifest/doc-typecheck/语料路径指向工具链本目录；T4（*.spec.ts/vitest）与作者向工具不随迁；
- 自洽化：verify-md-wrap 归 docGatesExtras（默认关，默认态需与物化中文规则文本自洽）；双语配对 scope 不含 .agents/notes（notes 双语可选）；
- notes-skeleton 补齐 archived 六类目录 + 基线 manifest + README 三件套有效 pairing record。

### feat(plugin): docGates 物化引擎
- pack.mjs loadPack 解析 toolchain 声明与 spec（分组预枚举，坏 spec 报错）；
- engine planProject (d) 阶段：伞 docGates 门控 + 组 feature 门控；package.json（doc-sync=启用 verify 链）确定性组装（managedUpdate）；
- 关闭组/伞 → 移除受管副本（字节等于源才删；用户改动 conflict 保留，--force 可强制；空目录裁剪）；audit 感知受管目录多余文件；
- cli：remove 动作支持；status/audit 文案；USAGE 同步。

### test(plugin): 26/26 绿
- 新增 toolchain.test.mjs（默认物化集、幂等、bilingual 开/关移除、docGates=false 整目录移除且用户改动保留、extras opt-in、audit、compose 确定性）与 cli-toolchain.test.mjs（CLI 端到端开关）；
- 真实验证：临时 git 项目 init → pnpm install → doc-sync 默认与 bilingual 均 exit 0；postinstall 写入 pre-commit 挂钩且外来 lefthook.yml 不覆盖；
- 文档：REQUIREMENTS/DESIGN/README/CHANGELOG/ACCEPTANCE/AGENTS/rules-pack README/plugin README/features 正文同步（运行时门禁口径由『不做移植』改为受管 docGates）。
- 真实验证（demo）：/Users/xuxifeng/Work/dsh-rules-demo `upgrade --yes --force` 后 audit exit 0（summary dir/skip、notes 空）；`.dsh-rules/toolchain` 内 `pnpm install` + `doc-sync` exit 0（受管 pre-commit 挂钩随 postinstall 安装）。
## 2026-09-03 — engine v1.0 (project-only initializer) + content M1 + tests

### feat(rules-pack): docBudgets materializes — `85fdda2`
- features/doc-budgets.md (tutorial/reference tiers, one-home-per-fact, wordcount budgets as guardrails);
- manifest row feature-doc-budgets (AGENTS.md, feature docBudgets); features/README rewritten to v1.0 defaults.

### test(plugin): CLI integration + upgrade-isolation + pollution — `8e1e752` `8748f02`
- CLI suite spawns the real bin (help exit, retirement error, init idempotent, JSON no global scope,
  hash only on a pack copy, --feature end-to-end); fixed `help` exit code bug;
- upgrade only changes the version-changed segment (notes byte-identical);
- polluted project: residue flags + user notes never clobbered.

### test(plugin): engine/pack regression suite — `5be7e7f` `9b29230`
- 9 engine tests (cleanSource, segment upsert/remove, multi-segment apply, feature gating,
  e2e no-leak/idempotency, skill conflict, hashPack drift, missing source, projectRoot);
- cordis.patch.sample.yml reverted to the live file://// convention.

### feat(cli): per-run --feature overrides — `d4081a1`
- --feature <key>=<true|false> (repeatable) with per-key merge over pack defaults; disabled segments removed; default roundtrip byte-convergent.

### feat(rules-pack): M1 content distillation — `38ed684`
- pointer-style standing-orders block (DP-A); notes-skeleton AGENTS/README trio/quadrant gates;
  text-link + bilingual discipline sections; manifest sha256 synced; no planning markers leak.

### feat(dsh-rules): align to REQUIREMENTS v1.0 — `ee9dd7d`
- engine global plane retired (install-global/planGlobal/~/.dsh); project skill copies;
  same-file multi-segment cumulative writes; byte-stable idempotency;
- rules-pack: features defaults (textLinkManagement/bilingualPairing/docBudgets on,
  bilingualDocsDiscipline off); docs aligned (REQUIREMENTS v1.0 as scope authority,
  DESIGN rewritten to v1.0).
## 2026-09-03 — traceability, live mount, M2 verified

### docs: ACCEPTANCE matrix + consistency pass
- ACCEPTANCE.md: REQUIREMENTS v1.0 D1-D10/R1-R10 traced to tests, commands, and code facts;
  milestone status (M0/M1 done); stale counts and status lines fixed across docs (17/17).

### docs: live mount applied (user consent)
- dsh-rules insert added to ~/.dsh/profiles/web/cordis.patch.yml; apply() verified loadable;
- host restart log shows [dsh-rules] mounted (tmux dsh:0.0).

### M2 verified (2026-09-03)
- real project /Users/xuxifeng/Work/dsh-rules-demo: init idempotent (rerun nothing to do),
  three default rule segments + skeleton materialized; status/audit clean (no global scope,
  no pack-drift).

## Pending (awaiting user decision)
- docBudgets wording review;
- DP-F/DP-G (skill declaration/self-install detection);
- M3 distribution.
