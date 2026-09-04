---
name: archive-agent-notes
description: Use when adding, auditing, pruning, archiving, restoring, or reviewing Agent Notes in a project initialized by dsh-rules; classify future value, resolve supersession, and preserve the archive's sealed triplet and manifest rules.
---

# Archive Agent Notes

Reduce the active decision corpus without erasing history that can still guide work. Judge every note
semantically; age and length are discovery aids, never archive criteria.

## Read the contracts

Read [Agent Note rules](../../notes/README.md), [archive instructions](../../notes/archived/AGENTS.md),
the applicable active-lifecycle instructions, and the root or subtree `AGENTS.md` files. Establish
current relevance from code, configuration, package documentation, generated or derived catalogs,
active documentation, newer Agent Notes, and inbound links.
For each rationale, determine whether it still owns or constrains current behavior before classifying
the note.
Use the project's archive verifier and documentation gates when they exist; do not invent an archive
format for a project that has none.

## Check supersession when adding a note

Every new Agent Note triggers a scoped audit of active notes covering the same decision, mechanism, or
rejected alternative. Inspect and group every note in the archive-audit scope under the same principle,
not only notes touched by a new-note supersession. Classify each
match as full, partial, or independent supersession, and resolve known matches in the same change.
Consolidate a full supersession only after preserving every unique rationale,
alternative, consequence, shipped verification fact, and named gap in the current owner. Keep partial
supersessions active and cross-link them in the same change. Repair inbound links before removing the
old record and its sibling files. Reject obsolete proposals and delete rejected notes only when they no
longer prevent a plausible mistake; retain the losing rationale when a rejected note remains a guardrail.
Independently useful related notes remain active and cross-linked rather than being deleted by association.
When a complete declared record (a triplet when applicable) is fully superseded and still qualifies for
retention, archive it in the same change rather than leaving the obsolete owner active.

## Classify by future value

- **Implemented — keep active:** retain rationale, alternatives, negative guarantees, durable or wire
  semantics, ownership boundaries, security rules, or reintroduction conditions that can guide a future
  change.
- **Implemented — archive:** archive a completed decision when the body is unlikely to guide future
  work, such as a one-off surface, a closed minor bug, or superseded implementation detail.
- **Proposed — never archive:** keep a live proposal active; if it is no longer worth pursuing, reject
  it with an honest reason and the project's rejected-note format.
- **Rejected — keep as guardrail:** retain a rejection while the losing idea remains a tempting,
  meaningful mistake.
- **Rejected — delete:** delete the complete rejected record when it is obsolete, superseded, no longer
  plausible, or unlikely to prevent re-litigation.

Do not archive toward a quota. Record genuinely borderline decisions, their reasons, and relevant word
counts in the handoff or review result.

Calibrated examples: keep an implemented note when its rationale still guards a durable boundary;
archive a completed one-off decision when its facts no longer constrain future work; keep a rejected
note while the losing design remains tempting; delete it only when it is no longer plausible or useful.
Record borderline cases instead of forcing them into a category.

For a standalone archive or pruning audit, inspect every note in scope and consistently classify
analogous and borderline cases; do not sample only the oldest or largest records.

## Archive one implemented triplet

When the project defines bilingual Agent Note triplets:

1. Move `foo.md`, `foo.zh.md`, and `foo.i18n.yaml` together from `implemented/<class>/` to
   `archived/<class>/`. Do not leave `implemented` in the archive path.
2. Make no body edits. Add only `Archived: YYYY-MM-DD` immediately below `Status: implemented` in both
   language files, using the same archive date.
3. Mechanically re-record the sidecar hashes for those metadata-only edits. Do not translate, reformat, update
   facts, or repair links inside the note.
4. Search inbound links from active prose. Redirect them to current authority, retain an archived link
   only when historical citation is intentional, or delete the link. Retained historical links must
   point to the new `archived/<class>/...` path.
5. Run the project's declared append-mode archive verifier for the archive-wide unsealed set (or pass
   the triplet path only when the verifier documents path-scoped support), then run its normal read-only
   verifier and the applicable documentation gates.

If no bilingual triplet format or archive verifier is declared, follow the project's declared note
format and validation path. If neither exists, stop and report that this archive workflow is
unsupported; do not leave the archive path or sealing semantics undefined.

The archive manifest is append-only: verify existing seals first, add only new hashes, and reject any
changed or missing sealed artifact. Never rewrite prior entries to make a changed artifact pass.

Before and after sealing, never verify, repair, or rewrite outbound links from an archived triplet.
After sealing, never edit, move, translate, reformat, or delete any sealed artifact. Archived notes remain
historical link targets, not current authority. Rejected-note deletion removes the
complete declared record or triplet, with all inbound links repaired or removed.

## Validate and report

Run the focused archive verifier, the project's documentation gate, applicable configured lint or static
checks, and the narrowest checks selected from the changed scope. If a required verifier or gate is
missing or fails, stop, report the exact unavailable or failing check, and do not claim that sealing or
validation succeeded. In a dsh-rules project, invoke package scripts through
`.dsh-rules/toolchain` (or the project's declared equivalent), including
`pnpm -C .dsh-rules/toolchain run verify-archived-agent-notes` and the relevant `lint` or `doc-sync`
script. Run `git diff --check` separately because it is not a package script. Report implemented notes
kept or archived, rejected notes kept or deleted, proposed notes rejected if any, and each genuinely
borderline outcome. Use [pre-push-checks](../pre-push-checks/SKILL.md) for supplemental evidence
selection when the change is headed for publication. Include pass/fail evidence for every check,
including `lint` when exposed by the dsh-rules toolchain. Do not claim archived outbound links are valid
when the archive verifier intentionally leaves them unchecked.
