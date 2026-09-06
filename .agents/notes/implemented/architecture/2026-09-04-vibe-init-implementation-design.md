# Agent Note: vibe-init implementation design

Status: implemented

## Problem

Implementation mechanics and design trade-offs were mixed into the public documentation set. That made a mutable engineering description look like a stable contract and made future changes likely to duplicate or contradict the requirements.

## Decision

`@maocili/vibe-init` is a standalone CLI initializer. It has no module, plugin, bundle, or host-mount surface. The CLI exposes the `vibe-init` binary and owns only project-local initialization and upgrade under `.vibe-init/`; it does not discover, migrate, or remove the old `.dsh-vibe/` namespace or its `dsh-vibe:*` markers. New state uses `schemaVersion: 2`.

The implementation is organized as a deterministic `plan` → `evaluate` → `apply` pipeline. `packages/` is the only versioned source for rule, note-skeleton, skill, feature, and toolchain content; `manifest.json` records feature defaults, toolchain groups, file targets, and content hashes. Every manifest source, row target, toolchain spec/target, and toolchain group source uses one safe-relative-path rule before pack I/O. One asynchronous `lstat`/`realpath` containment check then verifies every existing pack source and recursively enumerated asset against the real pack root, and verifies every planned, evaluated, applied, removed, installed, or state target against the selected project's real root. A caller may select a repository through a symlink to the project root, but a descendant symlink may never lead outside that real root. These checks reject pre-existing symlink escapes; they do not claim race-free filesystem transactions against concurrent path replacement. Invalid pack entries are excluded and write commands fail before planning, while read-only commands do not materialize unsafe entries. Each manifest file row's declared `sha256` must equal its loaded source hash, like skill assets; safe drift blocks `init` and `upgrade`, remains refreshable by `hash`, and is zero-drift after refresh. The engine appends marker-wrapped rule blocks, materializes fresh notes and selected skills, and manages the project toolchain while preserving user-edited content as conflicts. Repeated runs converge without writes, and `status`/`audit` reuse the same read-only plan.

`upgrade` is ownership-aware. Marker segments, generated documentation, declared toolchain files, declared skill files, and note-skeleton explainers are tool-owned and may be refreshed. Dated Agent Notes, note manifests, business documentation, and unknown files remain project-owned. Stale managed files are removed only when state proves ownership and the installed hash is unchanged; modified or ambiguous paths are retained as conflicts. Toolchain dependencies are installed before state is atomically committed; when the install fails, the pre-upgrade composed `package.json` is restored so a retried upgrade detects the composition change again and retries the install rather than committing state with dependencies missing. `init` refreshes the composed toolchain `package.json` only when an existing file is recognizably this tool's own composition (same declared package name); a foreign `package.json` in the managed home is a conflict and is never overwritten.

The former standalone design document is now a pointer; this note is the home for implementation decisions and their rationale. Stable scope and behavior remain in [`REQUIREMENTS`](../../../../docs/REQUIREMENTS-vibe-init.md), evidence remains in [`ACCEPTANCE`](../../../../docs/ACCEPTANCE.md), and the removal decision is recorded in the [standalone hard-cut Note](../simplification/2026-09-06-standalone-vibe-init.md).

## Alternatives considered

**Keep mechanics in a public design page.** This gives maintainers a familiar reference but leaves mutable design facts beside normative requirements and encourages a second history of decisions.

**Fold every implementation detail into `REQUIREMENTS`.** This would make the contract harder to review and would blur what users can rely on with how the initializer currently works.

**Use only commit messages.** Git history is useful for forensics but is not a discoverable, cross-linked decision record and does not state rejected alternatives.

**Retain a host plugin, bundle, and profile adapter.** The earlier implementation used `@maocili/dsh-vibe` with a DSH bundle and Cordis plugin, but those surfaces did not participate in project planning or application. The standalone hard cut removes their release coupling and keeps host integration as a separately justified future decision; its rationale and reintroduction conditions remain in the [standalone hard-cut Note](../simplification/2026-09-06-standalone-vibe-init.md).

**Keep the absolute file URL as the distribution path.** It works for a checkout but ties installation to one machine path and cannot be consumed from a package manager; it remains only as a historical local-development alternative.

## Consequences

Future architecture or implementation changes update this note and its Chinese counterpart in the same change. Public docs link here instead of copying mechanics. Any change to the package manifest, materialization semantics, conflict policy, namespace, or ownership policy must keep implementation tests and acceptance evidence aligned. The package manifest, CLI package check, state format, and ownership tests are the source of truth for the standalone distribution and project-local migration contract. Markdown-link verification treats `packages/README.md` as repository-owned documentation; canonical package templates are checked only at materialized roots (`AGENTS.md`, `docs/`, `.agents/`, and `.vibe-init/toolchain/`).
