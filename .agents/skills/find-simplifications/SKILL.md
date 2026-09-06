---
name: find-simplifications
description: Use when finding evidence-backed simplification candidates, writing or coalescing a simplification Agent Note, auditing a proposed removal of code, behavior, state, dependency, or compatibility surface, or folding simplification candidates from another PR or branch in a project initialized by vibe-init; inline TODO/FIXME/XXX work is also in scope.
---

# Find Simplifications

Turn a broad simplification request into a small set of evidence-backed candidates. A simplification
removes, folds, or demotes owned surface area; moving the same complexity behind a wrapper is not a
win. Prefer a few strong candidates over a long list of guesses.

This Skill is guidance, not a mechanical checklist: apply judgment within the stated evidence bar.

## Start with repository context

Read the root and applicable subtree `AGENTS.md` files, relevant architecture and testing documents,
the Agent Note tree and [its rules](../../notes/README.md), public documentation, configuration, and
the owning code. Treat an implemented Agent Note or explicit project policy as a current design
constraint until new evidence beats its rationale. Do not assume duplicated adapters, backends, or
providers are accidental; treat an intentional seam as protected by default and require an explicit
override to remove it. Unused internals may be removed only if the protected seam remains intact.

## Identify strong candidates

Look for:

- a public method, event, configuration key, helper, package, durable event, or test artifact with no
  production consumer;
- two representations that mirror one fact across durable state, transient events, caches, prompts, or
  user views;
- a seam with methods every implementation must support but no consumer uses;
- speculative product generality, dead compatibility paths, redundant state, or an added-then-removed
  layer;
- hand-rolled code that a maintained dependency or platform primitive can wholly replace; and
- an invariant, rollback path, expected-output set, or special-case test that protects only unused API.

A candidate is strong only when the evidence shows net deletion, simpler ownership, fewer states, or a
removed compatibility promise. Test- or documentation-only consumers must be shown non-load-bearing
before removal; a test/demo-only package with publish or dependency overhead can still be a candidate.
A small, reasonable behavior change may qualify when it materially reduces the design. “This looks
complex” or one cosmetic cleanup is a thin candidate.

## Survey broadly

Do not stop after the first obvious unused symbol. Perform the broad survey even when delegation is not
available, and prioritize the largest production-code deltas. Search production consumers separately from tests,
documentation, fixtures, generated artifacts, examples, scripts, dynamic loading paths, and wire or
durable formats. Use `rg` for exact symbols, event names, package names, configuration keys, method
forms, and serialized strings. Static-analysis output is a lead, not proof. If the user asks for broad
coverage and the project permits delegation, divide the survey by subsystem and require evidence from
each worker.

For TODO, FIXME, and XXX markers, use a stable semantic tag and concise actionable text; record the
concrete missing behavior, its owner, and the safety rationale for keeping or removing it. Convert a
qualifying marker into a specific simplification action or Agent Note. Do not use an inline marker for a
durable design decision, or turn urgency words or speculative future work into a candidate without
evidence.

## Audit trust and lifecycle boundaries

For every defensive copy, freeze, validator, queue, callback capture, or retained value, name where the
value came from and who owns it next. For asynchronous code, map each sentinel, readiness promise,
cancellation path, disposer, and state flag to an owner or transition. Map queued or serialized payload
boundaries separately from in-process handoffs. When several mechanisms mirror the same liveness or
settlement fact, prefer one lifecycle controller only after it preserves cancellation, disposal, and
terminal-outcome semantics. Preserve separate mechanisms
when they protect synchronous publication and rollback, callback containment, terminal-outcome
arbitration, worker or process ownership, or dispose-to-quiescence.

In-process typed handoffs normally borrow readonly values; queue payloads, configuration loaders, model
and tool JSON, parsers, serialized files, durable storage, workers, processes, and wire decoders own or
validate their inputs at their boundary.
Hostile-test evidence alone does not justify preserving a boundary unless the production contract
requires it.

## Evaluate dependency replacements

For a dependency-swap candidate:

1. Read the hand-rolled implementation and name the exact surface the dependency covers. Residual
   semantics count against the swap and stay in the note.
2. Check maintenance, adoption, transitive footprint, license, deployment, and failure-mode fit.
   Prefer a platform primitive at the project's supported engine floor when it covers the contract.
3. Check active Agent Notes for settled seams and compatibility obligations.
4. Compare net deletion: implementation, dedicated tests, and docs removed, minus the glue and new
   failure modes required. A wrapper that relocates complexity is not simplification.

Introducing a dependency can be a valid simplification route when project policy permits it and the
net-deletion and failure-mode evidence supports the replacement.

## Prove or reject each candidate

Classify every consumer as production, non-production, or ambiguous before writing a proposal. Inspect
examples and scripts that may be smoke paths instead of dismissing them as support code. Reject or
downgrade a candidate when a production caller, durable-format obligation, active decision, security
boundary, or required behavior still justifies it. Reject a proposal that creates unrelated churn
without reducing the API, required behavior, or ownership complexity. Prefer a targeted TODO with a
clear owner for a small, low-risk idea rather than a weak Agent Note.

## Coalesce superseded Agent Notes

When the request explicitly reduces or coalesces notes, or when implementing a simplification makes its
owning Agent Note obsolete, audit the relevant note tree. Discover the current owner from code,
configuration, generated catalogs, documentation, newer notes, and inbound links, then classify full
versus partial supersession from evidence; dates and titles are discovery hints only. Any surviving
current behavior, contract, durable format, compatibility obligation, or current rejected alternative
makes the result
partial, but transferable rationale alone does not make a note partial. Implementation-mechanics
inventories are not sufficient evidence, and a current negative design decision may still need its own
note. Use [archive-agent-notes](../archive-agent-notes/SKILL.md) for retention and archive mechanics. A full
supersession requires preserving every unique current behavior, rationale, alternative, consequence,
verification fact, and named gap in the new owner; partial supersessions remain active and cross-linked.
Repair inbound links before deleting a complete bilingual triplet, then search exact symbols and
filenames, configuration keys, event names, and serialized or wire strings after the edit to prove no
stale owner remains. For a removed feature, preserve its original
motivation, why it expired, lost capability, alternatives, and reintroduction conditions. For an
added-then-removed feature,
prove absence from production code, configuration, schemas, durable and wire formats, migration and
compatibility handling, documentation that presents the feature as available, and supported tests before
consolidating its old note. Deleted implementation mechanics and tests for deleted behavior are not
current verification evidence. Reject
consolidation when only one transport, default, implementation, or presentation was removed, or when
the removal note cannot preserve enough rationale to prevent accidental reintroduction. Tests that
enforce absence and the removal rationale may remain; tests for deleted behavior are not current
verification evidence. Never edit a sealed archived note.

## Fold another branch or PR

When the request includes another branch or PR, compare it with its verified independent repository base
before importing candidates. Port only non-overlapping candidates that still meet this Skill's evidence
bar, consolidate duplicates with the current owners, and do not preserve an artificial candidate count.
Reclassify every imported TODO or note against the combined tree; a candidate that is resolved or
unsupported after the merge is not retained merely because it was reported elsewhere.

If a branch or PR is in scope, update its description with the true candidate count and scope only
when that is part of the requested workflow. Close duplicate PRs only with explicit authorization or
clear ownership; otherwise report the duplicate and leave it open. Keep a PR in draft while the survey
expands; mark it ready only after candidates, review responses, and validation settle.

Do not turn every code survey into a repository-wide Agent Note audit. Coalesce overlapping proposals
into the existing owner rather than creating duplicate notes, and state the scope that was actually
audited.

## Write and validate the proposal

Put one substantial accepted candidate per Agent Note in `proposed/simplification/` using the project's
Agent Note format and deletion rule; use relative Markdown links. State the problem, evidence, proposed
deletion or consolidation, alternatives, strongest counterargument or lost capability, acceptance
criteria, risks, consumer and ownership impact, and the condition that would reject or reintroduce the
idea. Clean up affected tests, docs, READMEs, JSDoc, event taxonomies, snapshots, and generated files
when the candidate removes them. Do not present an unverified survey as a decision.

Treat established or hard-won defensive patterns as rejection blockers alongside active notes and
explicit policy; new evidence must overcome their rationale.

Run the narrowest checks that demonstrate the removed behavior is absent and retained behavior still
works. Include the project's baseline documentation, lint, whitespace, and relevant Skill validators,
as well as link, Agent Note, and task-specific gates for the changed surface. Report pass/fail results,
not only commands, with counts of added, consolidated,
retained-partial, and deleted notes or inline markers. Include surveyed areas, exclusions, strong
candidates accepted, thin candidates rejected or deferred, evidence for each decision, and the
no-qualifying-note result when applicable. For a branch or PR fold, report imported TODOs or notes,
consolidations, partial supersessions, deletions, old and current owners, and representative partial
cases with the evidence for safe deletion. Every consolidation group must include its own evidence;
when an added-then-removed scan finds no qualifying full supersession, report representative partial
cases rather than implying that the scan was empty.
