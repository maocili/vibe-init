---
name: archive-agent-notes
description: Use when adding, auditing, pruning, archiving, restoring, or reviewing Agent Notes in a project initialized by dsh-rules.
---

# Archive Agent Notes

Reduce the active decision corpus without erasing records that still guide work. Judge every note by its future decision value; age and length are discovery aids, never archive criteria.

## Read the project contracts

Read `.agents/notes/README.md`, lifecycle instructions, and the applicable root or subtree `AGENTS.md` files. Establish current relevance from code, configuration, active documentation, newer Agent Notes, and inbound links. Use the project's archive verifier and documentation gate when they exist; do not invent an archive format for a project that has none.

## Check supersession first

Every new Agent Note triggers a scoped search for active notes covering the same decision, mechanism, or rejected alternative. Consolidate full supersessions only after preserving each unique rationale, alternative, consequence, verification, and named gap in the current owner. Keep partial supersessions active and cross-link them. Repair inbound links before removing a superseded record and its sibling files.

## Classify by future value

- Keep an implemented note active when its rationale, negative guarantee, durable behavior, ownership rule, security boundary, or reintroduction condition remains useful.
- Archive an implemented note when the shipped decision is complete and its body is unlikely to guide another change.
- Never archive a proposal. Reject an obsolete proposal using the project's lifecycle format.
- Keep a rejected note only while it prevents a plausible, tempting mistake; otherwise delete its complete record and repair inbound links.

Do not archive toward a quota. Record genuinely borderline decisions in the handoff or review summary.

## Archive and validate

When the project defines bilingual triplets, move the complete English, Chinese, and sidecar records from `implemented/<class>/` to `archived/<class>/`. Make only the permitted archive metadata change, re-record the sidecar, repair inbound links, and seal the artifact through the archive verifier. Never edit, translate, reformat, move, delete, or repair outbound links from a sealed archive.

Run the focused archive verifier, the relevant documentation gate, and the narrowest additional checks selected from the changed scope. Report implemented records kept and archived, rejected records kept and deleted, proposals rejected, and every borderline outcome.
