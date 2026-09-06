---
name: archive-agent-notes
description: "Manage Agent Notes in a vibe-init project: add or review records, resolve supersession, audit future value, archive eligible implemented notes, prune obsolete rejections, or re-establish current rationale from sealed history."
---

# Manage Agent Notes

Preserve decisions that can still guide work while reducing obsolete active records. Judge notes by
their current decision value; age and length are discovery aids, never lifecycle criteria.

## Establish scope and authority

Resolve the requested note or directory scope. Do not turn a single-note task into a repository-wide
audit. Read the [Agent Note rules](../../notes/README.md), the applicable root or subtree `AGENTS.md`,
and any lifecycle instructions governing the records in scope. Establish current relevance from code,
configuration, package documentation, generated catalogs, active documentation, newer Agent Notes,
and inbound links.

Use the project's declared note format and validation tools. Do not invent archive paths, pairing
records, or sealing semantics when the project does not define them.

## Load the matching workflow

- When adding or materially changing a note, read
  [supersession and lifecycle changes](references/supersession.md).
- For a retention review, archive audit, or pruning pass, read
  [retention classification](references/retention-audit.md). Inspect every note in the explicit audit
  scope rather than sampling only old or large records.
- Before archiving an implemented record, deleting a rejected record, or recovering current rationale
  from a sealed snapshot, read [archive operations](references/archive-operations.md). For an archive,
  also read the project's `archived/AGENTS.md` before changing files.

Load more than one reference only when the requested operation crosses those modes, such as a new note
that fully supersedes an implemented record and archives it in the same change.

## Preserve common invariants

- Never archive a live proposal. Reject it honestly when it is no longer worth pursuing.
- Keep independently useful and partially superseded rationale active and cross-linked.
- Repair inbound links before moving or deleting their targets.
- Never edit, move, delete, translate, reformat, or repair outbound links from a sealed archive
  artifact. Archived records are historical evidence, not current authority.
- Do not archive toward a quota. Record genuinely borderline classifications and their reasons.

## Validate and report

For a change, run the project's documentation gate, applicable configured lint or static checks, and
`git diff --check`. Follow the operation-specific verifier instructions in the selected reference. If a
required gate is missing or fails, report the exact gap and do not claim that validation or sealing
succeeded.

Use [pre-push-checks](../pre-push-checks/SKILL.md) only when the change is headed for publication.
Report the explicit scope, each lifecycle outcome, borderline cases, files changed, and pass/fail
evidence for every check actually run. For a read-only review, report classifications and uncertainty;
do not mutate notes or seals.
