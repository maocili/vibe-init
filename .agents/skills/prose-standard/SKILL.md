---
name: prose-standard
description: Use when writing, reviewing, restoring, trimming, or auditing prose, comments, documentation, prompts, diagnostics, or visible strings in a project initialized by dsh-vibe; preserve required contracts while removing reasoning leakage and repetition.
---

# Apply the Prose Standard

Write enough to preserve the contract, then remove reasoning transcripts, repetition, and decoration. A
contract is an obligation, invariant, precondition, postcondition, or compatibility promise that a
reader, caller, implementer, producer, or consumer relies on.

## Establish inputs and ownership

Require an explicit `scope`. If it is missing, report the required input and stop; do not infer a
repository-wide scope or begin an interview. Accept `mode: automatic | interactive` when the workflow
needs calibration; default to `automatic`. Mode controls questions, not write authority: review and
audit report findings, while an explicit write, fix, or trim request authorizes clear changes.

Identify the requested prose surfaces and their owners before editing. Exclude `vendor/`, dependencies,
generated output, fixtures, snapshots, and `.agents/notes/archived/` unless the project policy assigns
an exact owner action. Change the source or generator before derivatives. Use
[documentation-standards](../documentation-standards/SKILL.md) for placement, budgets, and pairs; use
[trim-reasoning-leakage](../trim-reasoning-leakage/SKILL.md) for a focused leakage audit.

## Preserve the complete proposition

Before deleting or condensing prose, identify every relevant:

- actor and action;
- condition, timing, and ordering;
- modality such as must, may, or never;
- negative guarantee and exception;
- ownership, side effect, failure mode, and consequence.

Retain each clause in the surviving sentence or its owning document. Do not turn an obligation into a
preference, a risk into an endorsement, or a counterfactual into a shipped behavior. Keep a complete
local contract at the point of use and link extended rationale, algorithms, history, or examples to one
owning home.

## Cover each prose location

- **Public JSDoc:** document caller-visible return distinctions, throws or rejections, side effects,
  ownership, timing, cancellation, and durability.
- **Internal comments:** explain non-local structure, invariants, race ordering, ownership, security
  boundaries, or surprising failure behavior; delete control-flow narration and code restatement.
- **READMEs and cookbooks:** state consumer configuration, semantics, failures, limits, extension
  points, prerequisites, real entry paths, and observable verification.
- **Tests:** explain only non-obvious fixture, platform, entry-path, assertion, or indirect-observation
  choices; delete walkthroughs and inventories.
- **Agent Notes:** retain unique rationale, alternatives, consequences, shipped verification evidence,
  and named coverage gaps; implemented notes state current reality, not a plan.
- **Prompts, diagnostics, and visible strings:** name task-relevant concepts directly. Treat wording as
  behavior and validate it through output or state evidence.
- **Skills and agent instructions:** state behavioral guardrails, explicit scope limitations, failure
  handling, and whether the text is guidance or an executable checklist.

## Workflow

1. Confirm scope, mode, current branch or change range, applicable `AGENTS.md` files, exclusions, and
   the owning source.
2. Read the owning code or document and the relevant project standard before judging a passage.
3. Inspect the whole requested scope. Use searches and word counts to find candidates, then review
   dense prose without relying only on a search pattern.
4. Classify each candidate as keep, add, trim, restore, restructure, or defer. Apply only changes the
   request authorizes; do not manufacture edits to satisfy a deletion target.
5. Update the owner before generated derivatives. Update bilingual counterparts together and preserve
   reviewed text outside the changed unit.
6. Re-check analogous passages after learning a new rule. Keep one home per fact and repair every
   affected link.
7. Run narrow checks, documentation gates, `git diff --check`, and behavior evidence for visible text.
   Report exclusions and only checks actually run.

## Borderline decisions

A case is borderline only when at least two versions preserve the complete proposition but trade
accepted principles and this Skill does not resolve the tradeoff. In automatic mode, apply clear edits
and report genuine borderline cases without asking questions. In interactive mode, present the viable
versions, their factual or structural difference, and a recommendation. Do not weaken a proposition to
make progress. After a user decision, distill the durable principle into the project's examples or
owning standard, not into review narration.

## Limitations

Do not modernize generated artifacts, recorded fixtures, snapshots, or sealed archives. Do not remove a
passage merely because it is long, historical-sounding, or difficult to search: first determine whether
it carries a durable fact, evidence, or rationale. When a required fact cannot be verified from the
current owner, report the missing source and stop rather than inventing wording or behavior.
