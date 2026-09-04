---
name: trim-reasoning-leakage
description: Use when auditing or fixing prose that contains leaked planning, review, implementation-session, or change-history narration instead of durable repository facts; preserve factual clauses and remove only the transcript.
---

# Trim Reasoning Leakage

Reasoning leakage is prose whose vantage is the authoring session rather than the repository: it cites
private plans, narrates a change instead of the current state, or argues with a reviewer who has left.
The fix is not deletion alone when a passage carries factual clauses; restate each durable fact from the
repository's vantage and delete the surrounding transcript.

Use this Skill for comments, JSDoc, documentation, Agent Notes, prompts, and other visible prose when
the trigger is planning, review, implementation-session, or indexical change-history language. It is
guidance, not a script. A passage with no durable proposition is deleted outright. Prefer exact rules,
APIs, fields, types, validations, timing points, and failure states; retain technically exact terms and
searchable mechanism names.

## Apply the one test

Require an explicit target scope and exclusions. If scope is absent, report the missing scope and stop
instead of inferring repository-wide coverage. Ask whether a reader at the current revision, without a private plan, chat, review thread, or
uncommitted draft, can resolve every reference and verify every claim. If not, restate the surviving
facts and delete the unresolvable context. If yes, it is not leakage merely because it sounds historical;
on a current-state surface, however, a resolvable change story may still be misplaced documentation.

## Classify the leakage

1. **Dead design citations:** decision numbers, audit codes, draft section labels, phase names, or
   uncommitted plan references. Replace a useful fact with a direct statement and link its committed
   owner when one exists.
2. **Stack and change vantage:** “this PR,” “the previous commit,” “used to,” or “no longer.” Ban
   repository-version or indexical narration such as “the old X,” “v1,” “this cut,” “today,” or “now”
   when it contrasts with the past. State the shipped mechanism or present counterfactual instead;
   sanctioned Agent Note change-story sections may retain historical stage names.
3. **Review choreography:** reviewer attributions, round numbers, draft ordinals, or arguments addressed
   to a departed reviewer. Keep the decision, not the conversation.
4. **Control-flow and test narration:** walkthroughs of obvious branches, command sequences, or test
   steps. Delete obvious derivations and proofs, and delete reviewer-justification comments when the
   code already expresses the invariant. Keep only the non-obvious contract, invariant, or required
   evidence.
5. **Planning hedges:** “probably,” “for now,” or an unowned deferral. Promote a genuine obligation to
   the project's TODO or issue convention, state the bound, or delete the hedge.
6. **Authoring-language slips:** untranslated working-language fragments or private separators in prose
   whose language is otherwise different. Translate or remove them.
7. **Self-justifying prose:** explanations arguing that a cast, workaround, or change is correct for a
   reviewer. State the invariant or failure reason that makes it safe, or delete the comment.
8. **Unowned history:** migration narration or status language with no durable current behavior,
   rationale, evidence, or permitted postmortem role. Delete it or move it to its owning record.

## Keep durable exceptions

Do not remove an issue reference that resolves at the current revision, a measured bound, a required
suppression reason, a present-tense regression counterfactual, a runtime lifecycle distinction, or
permitted historical evidence in an Agent Note or postmortem. Keep issue and TODO references on their
current surfaces rather than relocating them. Permit merged-PR and issue citations in Agent Notes and
postmortems. Correct a false suppression reason instead of deleting it, and preserve project voice and
the `Alternatives considered` genre. A committed external standard or repository decision may remain
cited when its target is real and its section owns the fact.

## Restore missing coverage

Add or restore prose when code, types, or structure do not communicate a required contract. Cover the
owner appropriate to the fact:

- comments and module docs state the role, dependencies, responsibilities, non-obvious architecture,
  and genuinely complicated local structure;
- README and cookbook material covers consumer-visible or model-visible effects, durable maintainer
  traps, concise warnings, and likely misuse;
- examples and configuration comments explain access limits, wiring or load order, security, replay,
  exceptions, and unsafe assumptions;
- diagnostics name the failing subject or path, violated rule, and correction without narrating internal
  execution; and
- postmortems preserve incident sequence, evidence, causal chain, impact, and prevention.

Generated prose summaries must remain complete for the derivative surface when extracted from an owning
source. Implemented Agent Notes retain mechanisms and remove planning or acceptance checklists.

## Workflow

1. Confirm the requested scope and exclusions. Never edit `vendor/`, generated artifacts, fixtures,
   snapshots, or `.agents/notes/archived/`; prevent excluded symlinks from being traversed or later
   re-admitted by an include glob. Inspect an archived note only to resolve an exact historical inbound
   citation.
2. Audit read-only first with the search probes in
   [references/recall-batteries.md](references/recall-batteries.md), then read the densest prose in
   scope without relying on search hits alone.
3. Before every edit, enumerate the passage's actor, action, conditions, modality, ownership, failure,
   consequence, evidence, and non-obvious rationale. Trimming is valid only when every factual clause
   survives and the result is clearer; shorter wording alone is not an improvement. Check
   [references/examples.md](references/examples.md) for overcorrection traps. Preserve rationale when
   omitting it could cause misuse or an incorrect simplification; otherwise state the consequence and
   link the rationale's owner.
4. Fix the owner first: change source JSDoc before generated catalogs, canonical docs before projections,
   and both sides of a bilingual pair together. For type-equivalence blocks, update the owning type or
   interface before derived prose. Re-record bilingual consistency metadata when required. Treat
   model-visible wording as behavior and require output or snapshot evidence before changing it.
5. Classify each passage as keep, restate, delete, relocate, or defer. Preserve every durable proposition
   and keep one home for each rationale.
6. Re-run searches and the project-declared documentation, link, pairing, and behavior gates. Confirm
   every remaining citation resolves at the current revision. The final scan may contain only sanctioned
   hits, including this Skill's calibration files and quoted evidence from the owning note; report any
   other hit instead of dismissing it. Verify the reviewed diff contains no excluded path.

Before accepting the edit, check that it did not turn an obligation into an endorsement, promote a
hypothetical into shipped behavior, delete a load-bearing fact, or drop provenance.

Interactive review is entered only on explicit user request. In that mode, group analogous cases, offer
two or three viable alternatives without distractors through the requested channel, and state the
recommendation plus the factual difference. A single proposition-preserving rewrite is not borderline;
borderline cases are unresolved ownership, scope, or contract evidence and must be reported.

## Limitations

Search batteries are discovery probes, not the definition of leakage. Do not modernize sealed archives,
recorded fixtures, snapshots, or generated output by hand. Do not delete a difficult passage until its
propositions have been checked; when its owner or intended history cannot be established, report the
uncertainty and stop rather than guessing.
