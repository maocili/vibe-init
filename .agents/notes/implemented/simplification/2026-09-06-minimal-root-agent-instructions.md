# Agent Note: minimal root agent instructions

Status: implemented

## Problem

The root `AGENTS.md` and its managed rule segments repeated the same obligations in English and Chinese and exposed detailed note templates, lifecycle mechanics, documentation procedures, and commit cadence in every session. Those details belonged to lower-level rule owners and consumed persistent context while constraining task planning independently of the work being performed.

## Decision

All vibe-init-owned `AGENTS.md` files and managed rule-pack sources materialized into them use English without a Chinese summary. The repository root keeps only its identity, product and source-of-truth boundaries, validation commands, and navigation links. Each managed root segment states one durable contract and points to the document or skill that owns the detailed workflow. Project content outside managed markers remains user-owned and is never rewritten for language consistency.

The rule pack no longer imposes a commit after every independently verifiable step. Commit grouping remains a task-level or repository workflow decision rather than a permanently injected instruction. Detailed Agent Note format and lifecycle rules remain in the [Agent Note rules](../../README.md); documentation placement and budget procedures remain in the [documentation standard](../../../../docs/AGENTS.md).

This decision narrows only root instruction presentation. It does not remove Agent Notes, documentation budgets, relative-link validation, bilingual document delivery, or the ownership and upgrade behavior described in the [implementation design](../architecture/2026-09-04-vibe-init-implementation-design.md). It refines the root-budget presentation established by the [documentation budget policy](../process/2026-09-04-documentation-budget-policy-sync.md) without changing its mechanical ceilings.

## Alternatives considered

**Keep bilingual summaries but shorten both halves.** This still spends persistent context twice on every surviving rule and preserves two copies that can drift.

**Keep detailed rules in the root and raise or retain the budget.** A larger allowance does not address ownership or progressive disclosure; it only permits misplaced process detail to remain resident.

**Remove the detailed rules entirely.** This would discard useful contracts and verification procedures. Keeping them in their owning documents and skills preserves them on demand.

**Retain mandatory per-step commits.** This improves traceability and isolates review or revert boundaries by forcing more checkpoints, but it prevents an agent from choosing an atomic change boundary appropriate to the task and turns a version-control preference into a universal planning constraint. The former mandatory commit-cadence decision is fully superseded by this note.

**Require a commit after every command or file edit.** These operations are not necessarily independently verifiable changes, so the resulting history would be noisy without adding meaningful recovery boundaries.

## Consequences

Agents load a smaller, single-language root contract and consult detailed rules only when the task enters the relevant subtree or invokes the relevant skill. Agents may still commit at meaningful verified boundaries when the task or repository workflow calls for it. Tests reject Chinese text across every vibe-init-owned materialized `AGENTS.md`, and reject bilingual summaries, Agent Note template headings, and commit-cadence instructions in materialized root rules while retaining marker ownership, feature gating, and idempotent upgrades.
