---
name: documentation-standards
description: Use when writing, moving, reviewing, or auditing documentation in a project initialized by vibe-init; choose its owning tier, answer placement or tutorial-progression questions, repair budget failures, remove prose slop, and satisfy declared gates.
---

# Apply Documentation Standards

This Skill supplies the documentation workflow, not a replacement for project-specific hierarchy or
ownership. It covers Markdown, JSDoc, code comments, and other repository prose; use
[prose-standard](../prose-standard/SKILL.md) for focused coverage and editorial judgment. Read the
[root rules](../../../AGENTS.md), the [Agent Note rules](../../notes/README.md), `docs/AGENTS.md` when
present, the owning source, relevant active Agent Notes, applicable archived-note policy, and applicable
pairing, postmortem, generated-output, and site policies before reviewing, auditing, or editing. Treat
these as sources of truth: read them to establish facts, and link to them rather than re-summarizing
their full contents. Verify claims against the owning source and active notes; if a fact cannot be
verified, stop and report the missing evidence.

## Review structure before prose

1. Locate the document in the repository and navigation trees. State its subject and identify direct
   children and their high-level behavior before deciding where new material belongs. Keep test
   infrastructure at its lowest owning document unless that infrastructure is the subject.
2. Set the permitted detail level. Keep full detail about the document's subject, summarize direct
   children by purpose and responsibility, and move deeper explanations to their owning descendants
   with links.
3. Classify the document by intended use, not by path or title. A tutorial leads a reader through
   ordered work to an observable outcome; a reference supports lookup within an explicit scope without
   requiring a sequence of lessons. A postmortem is a reference scoped to one incident, preserves causal
   chronology as evidence, and is not a tutorial sequence.
4. For tutorials, identify the starting reader, classify concepts as beginner, intermediate, or
   advanced, trace each concept to its prerequisites, and order them by both prerequisites and
   difficulty. Move optional
   advanced detail to a later section or an owning reference.
5. Split substantial mixed forms; a small secondary form may remain in a clearly labeled section. Keep
   every fact in one home. Use links instead of copied catalogs,
   duplicate rationale, or implementation history.

Do not apply this structural pass to Agent Notes; their rationale and alternatives belong to the Agent
Note format.

## Audit the corpus

Inspect the requested scope, not only the largest file. Use `rg` and an initial word-count/outlier scan
across every existing and new or untracked in-scope document, including unbudgeted documents, to find
likely issues,
then judge every passage against its owner:

- Hunt dead links and fragments, duplicated rules, stale inventories, reasoning transcripts, test or
  status walkthroughs, and paragraphs that combine unrelated rules.
- Exclude `vendor/`, dependencies, generated output, fixtures, snapshots, website projections, and
  `.agents/notes/archived/` from editorial cleanup unless the project's policy explicitly assigns an
  owner action. Apply the site's policy to projected output. Archived notes are frozen history and must
  not be modernized.
- Change a generator or canonical source before regenerating its derivative. Never hand-edit generated
  catalogs or projected site output; replace handwritten catalogs, test/status inventories, and JSDoc
  restatements with links to their authoritative sources.
- Before moving, renaming, or deleting a page, search every inbound reference, including source comments
  and strings when link gates cannot see them, and update the old home, new home, active sources,
  mappings, manifests, navigation, counterparts, and links atomically. Deleting a page also removes or
  redirects its declared non-link owners. Never alter frozen archive targets or perform archive-wide
  cleanup.
- For a paired document, update the counterpart in the same change and re-record its consistency
  metadata only after semantic review. Where pairing is optional, record its counterpart and metadata
  maintenance cost and prefer an unpaired home for high-churn content.
  - In an implemented Agent Note, remove migration plans, future-tense specification language, and
    acceptance-task checklists, but keep a concise verification contract naming shipped behavior and
    owning tier, durable rationale, and named coverage gaps.

Prefer load-bearing rules of one to three lines. Cut stories, status notes, and derivation paths; do not
create new explanations merely to relocate disposable reasoning.

Use [trim-reasoning-leakage](../trim-reasoning-leakage/SKILL.md) when the requested cleanup is a focused
leakage audit. If the requested change is a proposed simplification, name the proposed simplification
Agent Note and use [find-simplifications](../find-simplifications/SKILL.md) for its evidence workflow.
If removing documentation would change promised behavior, stop the ordinary cleanup and route the
behavior change through a proposed simplification or the owning Agent Note. If the owning source cannot
verify a fact, report the missing evidence and stop rather than inventing documentation.

## Handle budgets

When a budget gate is red, first relocate descendant-owned detail, then condense the material that still
belongs in the document, and raise a ceiling only when the content needs the space and the change records
why. A word-count limit is a guardrail, not a reduction target. In a vibe-init project, inspect the
declared budget with `pnpm -C .vibe-init/toolchain run verify-doc-budgets --list` when that command is
available.

## Validate and report

This workflow is guidance, not an unconditional command checklist. Run the narrowest applicable
documentation, link, pairing, generated-artifact, configured lint or static, and task-specific checks.
For a vibe-init project
this normally includes:

```sh
pnpm -C .vibe-init/toolchain run doc-sync
git diff --check
```

Run only commands that the project declares and that the changed surface requires; for a pairing
metadata write, complete semantic review before invoking the write mode. Do not claim a gate
that was not run. Report the inspected scope, document placement, canonical sources or projections
changed, deliberate keeps or exclusions, measured before/after word deltas when budgets are involved,
any ceiling or deliberate long-document/soft-target exception and its justification, and exact checks
that produced the evidence.
