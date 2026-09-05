# Agent Note: Upgrade ownership migration

Status: implemented

## Problem

The original upgrade path reused init's conflict policy, so it could not distinguish plugin-managed
content from project assets. That made edited skills appear unsafe to refresh, treated notes as stale
copies, and could not explain whether an old file was safe to remove. Dependency installation also
had no durable record of which pack version had been applied.

## Decision

`upgrade` now plans an ownership-aware migration using project-local `.dsh-vibe/state.json`. Marker
segments, generated documentation, declared toolchain files, declared skill files, and note skeleton
explainers are managed and may be refreshed from the current rule pack. Dated Agent Notes, note
manifests, business documentation, and unknown files remain project-owned. Stale managed files are
removed only when state proves ownership and the installed hash is unchanged; modified or ambiguous
paths are reported as conflicts and retained. Every write previews its classified plan, requires
`--yes` in non-interactive use, installs changed toolchain dependencies before committing state, and
writes state atomically only after all work succeeds.

## Alternatives considered

**Reuse init's conflict detection.** This preserves the old safety rule but cannot implement version
migration or distinguish a managed dependency from a user addition.

**Overwrite every path under `.agents/`.** This would make upgrades simple but destroys Agent Notes,
user skill additions, and project documentation that the plugin does not own.

**Infer stale ownership from filenames alone.** Fixed paths help migrate projects without state, but
filename-only deletion can remove unrelated files; legacy migration therefore reports ambiguity and
never deletes unknown paths.

## Consequences

New and upgraded projects carry a schema-versioned ownership snapshot with source and installed hashes.
The status and audit commands expose missing, invalid, outdated, and drifting state plus pending
dependency installation. Rule-pack changes must continue to refresh manifest hashes and update the
requirements, acceptance evidence, and current-behavior documentation in the same change.
