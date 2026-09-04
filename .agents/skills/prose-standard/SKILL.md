---
name: prose-standard
description: Use when writing, reviewing, restoring, trimming, or auditing prose, comments, documentation, prompts, or visible strings.
---

# Apply the Prose Standard

Write enough to preserve the contract, then remove reasoning transcripts, repetition, and decoration. A contract is an obligation, invariant, precondition, postcondition, or compatibility promise that a reader, caller, implementer, producer, or consumer relies on.

## Establish scope and ownership

Identify the requested prose surfaces and their owners before editing. Respect project-declared exclusions such as generated output, vendored code, fixtures, snapshots, and sealed archives. Change the source or generator before derivatives. Use the documentation standard for placement, budgets, and pairs; use `trim-reasoning-leakage` when the task is specifically to remove session or review narration.

## Preserve the complete proposition

Before deleting or condensing prose, enumerate the actor, action, conditions, timing, modality, exceptions, ownership, failure, and consequence. Retain every necessary clause in the surviving sentence or its owning document. Do not turn an obligation into a preference, a risk into an endorsement, or a counterfactual into a shipped behavior.

## Cover each prose location

- Documentation explains current behavior, public configuration, limits, and safe use in its owning tier.
- Comments and JSDoc explain non-obvious behavior, failure, timing, ownership, invariants, or rationale that code cannot express; they do not restate control flow, tests, or review discussion.
- Prompts, diagnostics, CLI text, and UI strings name the user's task-relevant concepts directly. Treat visible wording as behavior and validate it through the relevant output.
- Agent Notes retain durable rationale and alternatives; archived notes remain frozen evidence rather than current authority.

## Edit and validate

Read the edited prose in context and compare it against the owning code, configuration, or behavior. Keep one home per fact and link to it instead of duplicating rationale. Run the narrow applicable checks, documentation gates, `git diff --check`, and behavior evidence for visible strings. Report exclusions and only checks actually run.
