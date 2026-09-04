---
name: trim-reasoning-leakage
description: Use when prose contains implementation-session, review, or change-history narration instead of durable repository facts.
---

# Trim Reasoning Leakage

Reasoning leakage is prose whose vantage is the authoring session rather than the repository: it cites private plans, narrates the change instead of current behavior, or argues with a reviewer who has left. Restore durable facts before deleting surrounding narration.

## Apply one test

Ask whether a reader at the current revision can resolve every citation and verify every claim without a private plan, chat, review thread, or uncommitted draft. Use the [Agent Note rules](../../notes/README.md) when a durable rationale owns the citation. If not, restate the enduring fact from the repository's perspective. Delete a passage only when it carries no durable proposition.

## Classify the leakage

Remove dead decision labels, private audit identifiers, stack or review vantage, change narration, self-justifying reviewer prose, control-flow or test walkthroughs, and unowned planning hedges. Replace a genuine deferred obligation with the project's TODO or issue convention. Translate or remove authoring-language fragments that do not belong in the target prose.

Keep committed issue references, measured bounds, suppression reasons, present-tense regression facts, runtime old/new state descriptions, and permitted historical evidence in Agent Notes or postmortems. Do not modernize generated artifacts, snapshots, fixtures, or sealed archived notes.

## Audit and verify

Scope the review explicitly and use [references/recall-batteries.md](references/recall-batteries.md) as search probes, not as the definition. Read dense prose without a search pattern, then fix the owning source before generated derivatives and update paired documents together. Before removing text, check [references/examples.md](references/examples.md) for overcorrection traps. Run the gates for every touched surface and confirm remaining repository citations resolve at the current revision.
