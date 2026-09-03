# Changelog

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

## Pending (awaiting user decision)
- Real mount into ~/.dsh/profiles/web/cordis.patch.yml + M2 verification;
- docBudgets wording review; DP-F/DP-G (skill declaration/self-install detection); M3 distribution.
## 2026-09-03 — traceability & consistency

### docs: ACCEPTANCE matrix + consistency pass
- ACCEPTANCE.md: REQUIREMENTS v1.0 D1-D10/R1-R10 traced to tests, commands, and code facts;
  milestone status table (M0/M1 done; M2 needs user confirmation; M3 not started)
- stale counts and status lines fixed across docs (17/17; docBudgets done; DESIGN todo tail)
