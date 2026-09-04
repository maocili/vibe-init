---
name: documentation-standards
description: Use when writing, moving, reviewing, or auditing documentation in a project initialized by dsh-rules.
---

# Apply Documentation Standards

Read `docs/AGENTS.md`, root rules, the owning source, and relevant Agent Notes before editing. Apply project-specific policies where they exist; this skill supplies the editorial workflow, not a replacement documentation hierarchy.

## Review structure before prose

Classify human-facing documents as tutorial or reference. A tutorial leads a reader through an ordered outcome; a reference defines the current lookup scope. Give every fact one home, keep full detail at the owning level, and link to it from higher-level pages. Keep rationale and decision history in Agent Notes, not stable reference pages.

For a tutorial, identify prerequisites and order concepts by dependency and difficulty. For any page, remove descendant-owned detail, duplicated catalogs, and implementation-status narration before adding prose. Change generated catalogs through their declared source or generator.

## Audit the corpus

Search for duplicated rules, dead links and fragments, change narration, stale inventories, reasoning transcripts, and paragraphs that combine unrelated rules. Confirm facts against the owning code or configuration rather than treating an existing page as proof. Before moving or deleting a page, search inbound references and update every target and fragment in the same change.

## Handle budgets and validation

When a word-count gate is red, first relocate content to its owning tier, then condense content that remains, and raise a ceiling only when the content needs the space and the project records why. Run the project's applicable documentation gates, plus link, pairing, or generated-artifact checks required by the changed surface. Report scope and checks actually run.
