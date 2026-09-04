# Agent Note: docGates toolchain migration into rules-pack

Status: implemented — M1b shipped 2026-09-04 (REQUIREMENTS D11/D12)

## Problem

The container's runnable doc-gate toolchain (verify-* ts scripts, bilingual pairing tooling, pre-commit hooks) lived only in `../vibe-coding-templates/.template` and a dev-only copy in this repo's `.template/`. REQUIREMENTS v1.0 had carved out a full runtime port — consumers initialized by dsh-rules got rule text (segments, notes skeleton, features) but nothing executable, so the disciplines shipped by the pack had no mechanical enforcement.

## Decision

Migrate the necessary toolchains into `rules-pack/` and materialize them per feature into every consumer project.

- New `rules-pack/toolchain/` + `manifest.toolchain` + `toolchain/spec.json`: seven groups (`scaffold`, `hooks`, `base`, `text-link`, `doc-budgets`, `bilingual`, `extras`) declare files, npm scripts, and devDependencies. The umbrella feature `docGates` (default true) gates the scaffold, standing note gates, and T3 lefthook hooks; `textLinkManagement`/`docBudgets`/`bilingualDocsDiscipline`/`docGatesExtras` gate their own script groups (per-feature scripts, option A). Materialization lands in `.dsh-rules/toolchain/`; the engine composes `package.json` deterministically from enabled groups (doc-sync chains the installed verify gates) and removes managed copies when a group or the umbrella turns off — byte-equal files are removed, user edits stay (conflict) unless `--force`.

- Distillation deltas: gates scan the project root (`agentCorpusRoot()`, the dir holding `.agents`) instead of the script's parent; data/corpus paths (doc-budgets manifest, translation-pairing manifest, `docs/i18n/` corpus, doc-typecheck tsconfig/tmp/tsc) resolve beside the gates in the toolchain home; `*.spec.ts`/test-fixture-cleanup (T4, vitest) and authoring-only tooling stay in the source repo.

- Self-consistency fixes so the default materialized state passes its own gates: `verify-md-wrap` moved to `docGatesExtras` (opt-in — the pack's wrapped Chinese rule text would otherwise fail a one-physical-line gate); bilingual pairing scope excludes `.agents/notes/**` (notes stay bilingual-optional, enforced by note gates instead); the notes skeleton now ships the archived kind directories + baseline manifest and a valid README-trio pairing record.

## Alternatives considered

- **Single all-in-one toolchain feature (option B)** — rejected: default consumers would carry jsdom/mermaid/typescript even with the heavy/bilingual features off; per-feature gating (option A, chosen) keeps the default install light and matches 'each discipline feature has its own supporting scripts'.

- **Keep `verify-md-wrap` on by default and reformat all pack prose** — rejected: wrapping the whole Chinese/English rule text into one-physical-line paragraphs fights the repo's prose style; an opt-in strict gate is honest about cost.

- **Enforce strict bilingual pairing over notes** — rejected: dsh-rules notes are bilingual-optional by design; the container-style pairing gate now covers docs/README/contributing product pairs only.

- **Ship the container's 846-line lefthook installer (T4-style)** — rejected: consumers get a thin distilled installer that writes a marker-owned `lefthook.yml` and never overwrites a foreign one.

## Consequences

- Consumer projects get runnable gates: default `doc-sync` and the bilingual full chain both pass on a fresh project (exit 0); `pnpm install` inside the toolchain triggers postinstall and installs the pre-commit hook.

- `--feature` overrides stay per-run (not persisted); feature defaults come from the manifest, so `docGates=false` removes the whole toolchain in that run. Persistence is future work.

- Engine tests grew from 17 to 26 (toolchain materialization/removal, audit awareness, CLI end-to-end); REQUIREMENTS/DESIGN/README/ACCEPTANCE and feature texts were updated to the managed-toolchain scope.

- Node >= 20 and pnpm are consumer prerequisites (source-form runtime; consumers run `pnpm install` themselves; no deps/lockfiles are shipped).
