# Agent Note: vibe-init implementation design

Status: implemented

## Problem

Implementation mechanics and design trade-offs were mixed into the public documentation set. That made a mutable engineering description look like a stable contract and made future changes likely to duplicate or contradict the requirements.

## Decision

`@maocili/vibe-init` is a standalone CLI initializer. It has no module, plugin, bundle, or host-mount surface. The CLI exposes the `vibe-init` binary and owns only project-local initialization and upgrade under `.vibe-init/`; it does not discover, migrate, or remove the old `.dsh-vibe/` namespace or its `dsh-vibe:*` markers. New state uses `schemaVersion: 2`.

The implementation is organized as a deterministic `plan` → `evaluate` → `apply` pipeline. `packages/` is the only versioned source for rule, note-skeleton, skill, feature, and toolchain content; `manifest.json` records feature defaults, toolchain groups, file targets, and content hashes. The engine appends marker-wrapped rule blocks, materializes fresh notes and selected skills, and manages the project toolchain while preserving user-edited content as conflicts. Repeated runs converge without writes, and `status`/`audit` reuse the same read-only plan.

`upgrade` is ownership-aware. Marker segments, generated documentation, declared toolchain files, declared skill files, and note-skeleton explainers are tool-owned and may be refreshed. Dated Agent Notes, note manifests, business documentation, and unknown files remain project-owned. Stale managed files are removed only when state proves ownership and the installed hash is unchanged; modified or ambiguous paths are retained as conflicts. Toolchain dependencies are installed before state is atomically committed.

The former standalone design document is now a pointer; this note is the home for implementation decisions and their rationale. Stable scope and behavior remain in [`REQUIREMENTS`](../../../../docs/REQUIREMENTS-vibe-init.md), evidence remains in [`ACCEPTANCE`](../../../../docs/ACCEPTANCE.md), and the removal decision is recorded in the [standalone hard-cut Note](../../simplification/2026-09-06-standalone-vibe-init.md).

## Alternatives considered

**Keep mechanics in a public design page.** This gives maintainers a familiar reference but leaves mutable design facts beside normative requirements and encourages a second history of decisions.

**Fold every implementation detail into `REQUIREMENTS`.** This would make the contract harder to review and would blur what users can rely on with how the initializer currently works.

**Use only commit messages.** Git history is useful for forensics but is not a discoverable, cross-linked decision record and does not state rejected alternatives.

**Retain a host plugin, bundle, and profile adapter.** The earlier implementation used `@maocili/dsh-vibe` with a DSH bundle and Cordis plugin, but those surfaces did not participate in project planning or application. The standalone hard cut removes their release coupling and keeps host integration as a separately justified future decision; its rationale and reintroduction conditions remain in the [standalone hard-cut Note](../../simplification/2026-09-06-standalone-vibe-init.md).

**Keep the absolute file URL as the distribution path.** It works for a checkout but ties installation to one machine path and cannot be consumed from a package manager; it remains only as a historical local-development alternative.

## Consequences

Future architecture or implementation changes update this note and its Chinese counterpart in the same change. Public docs link here instead of copying mechanics. Any change to the package manifest, materialization semantics, conflict policy, namespace, or ownership policy must keep implementation tests and acceptance evidence aligned. The package manifest, CLI package check, state format, and ownership tests are the source of truth for the standalone distribution and project-local migration contract.
