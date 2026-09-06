# Agent Note: Documentation information architecture

Status: implemented

## Problem

The root README, the docs index, requirements, and design each repeated the initializer's status, command surface, scope boundary, and repository layout. Repeated prose made the public entry long and allowed otherwise small changes to leave contradictory paths or stale test counts behind.

## Decision

The root README is the concise user entry: install the standalone CLI, initialize a project, select features, and run tests. `docs/README.md` is navigation only. REQUIREMENTS retains the scope contract and defaults; ACCEPTANCE retains evidence; implementation design and decision-level history live in the linked Agent Notes. Each fact has one primary home, with links instead of duplicated explanations.

Current documentation uses the initializer-owned `.vibe-init/`, `vibe-init:*`, and `.vibe-init/schema2` semantics; the old `.dsh-vibe/` namespace is neither discovered nor migrated. The removal decision and ownership boundary are cross-linked through the [standalone hard-cut Note](../simplification/2026-09-06-standalone-vibe-init.md) and the [Upgrade ownership migration Note](2026-09-04-upgrade-ownership-migration.md).

## Alternatives considered

**Keep every document self-contained.** This avoids link-following but duplicates the command surface and status in several places, recreating the drift that prompted the change.

**Put all detail in the root README.** This is convenient for a first read but buries normative and maintainer material in an operational guide.

## Consequences

Future user-facing changes start in the root README, contractual changes in REQUIREMENTS, evidence changes in ACCEPTANCE, and architecture/history changes in the owning Agent Note. A documentation change that changes one of those boundaries updates its owning document rather than copying the same prose elsewhere.
