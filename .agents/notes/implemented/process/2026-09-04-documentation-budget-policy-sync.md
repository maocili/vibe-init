# Agent Note: documentation budget policy sync

Status: implemented

## Problem

The initializer's budget gate enforced only a root `AGENTS.md` ceiling, while the source template also governs the documentation subtree with its own target, headroom rule, and relocation-first workflow. Projects initialized by the initializer therefore lacked the same documentation policy as the source template.

## Decision

The initializer materializes `docs/AGENTS.md` when `docBudgets` is enabled and budgets both standing instruction files: mechanical ceilings are 1900 words for the root and 1320 for `docs/AGENTS.md`. The shared policy states editorial targets of 1600, 600 for ordinary subtree instruction files, and 1250 for `docs/AGENTS.md`, with at least 5% headroom. A red gate is handled by relocating content, then condensing it; raising a ceiling requires justification in the same change.

The current policy describes initializer/tool-owned `.vibe-init/` content and standalone install documentation. The old `.dsh-vibe/` namespace is not discovered or migrated. Ownership and removal rationale are cross-linked in the [standalone hard-cut Note](../simplification/2026-09-06-standalone-vibe-init.md).

## Alternatives considered

**Keep only the root ceiling.** This preserves the old minimal setup but leaves documentation rules unbounded and diverges from the source template.

**Budget every Markdown file.** This would turn budgets into a reduction target and duplicate tier ownership; review remains the right control for unlisted documents.

**Use only editorial targets without a gate.** This relies on memory and cannot detect missing or overlong standing documents mechanically.

## Consequences

`docs/AGENTS.md` is an initializer-managed project file and is excluded from bilingual translation pairing like other instruction files. The budget manifest is now the authoritative per-file ceiling list; changes to a standing document must keep its manifest entry and source hash synchronized. Documentation changes use standalone install paths and do not assign migration work for the retired namespace.
