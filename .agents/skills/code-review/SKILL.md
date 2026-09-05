---
name: code-review
description: Use when reviewing a pull request or change in a project initialized by dsh-vibe; verify live scope, contracts, lifecycle and security behavior, required evidence, and actionable findings.
---

# Review a Change

This Skill is guidance, not a complete checklist. Re-establish the live comparison range, inspect the
complete diff, and read enough surrounding code, documentation, configuration, tests, and active Agent
Notes to understand the design before reporting a finding.

## Establish the review range

Confirm the repository root, current worktree, target branch or pull request, exact base and head
commits, and complete diff from the source-control provider. Fetch or refresh the verified base and head
refs before reviewing. For a pull request, run the project's declared change-scope command when one
exists; otherwise use the verified refs with an explicit VCS diff. Treat scope output as an inventory,
not semantic review evidence. Do not guess a base ref, branch, package boundary, or generated-file policy.
If the range changes
because of a retarget, merge, or rewritten history, re-establish it and repeat the scope check before
continuing.

## Read the owning contracts

Read the root and applicable subtree `AGENTS.md` files, public interfaces, configuration, generated-
source policy, testing policy, documentation policy, applicable translation and terminology rules, and
[Agent Note rules](../../notes/README.md). For changed prose, apply [prose-standard](../prose-standard/SKILL.md);
for paired documentation, review both languages and the declared authority even when a structural or
hash gate is green.

## Blocking review requirements

Prioritize correctness, security, lifecycle, ownership, missing required behavior, and missing evidence
over style. A short review with one substantiated blocker is better than a list of unverified nits.

- Trace both sides of every changed interface, including errors, cancellation, disposal, data ownership,
  durability, and compatibility promises.
- Check asynchronous setup, callbacks, processes, and teardown for publication races, cancellation
  during waits, readiness, rollback, cleanup, callback containment, and quiescent disposal.
- Require every new registry, plugin, or listener contribution to have an owned unregister or dispose
  path and disposal-test evidence. Cover late subscription, reload, and restart cases by reconstructing
  invariant or derived state from durable history, not only from future events.
- Map each abstraction, state machine, option, defensive copy, and compatibility path to a current owner
  and consumer. Challenge speculative generality and consumer-specific behavior leaking into shared APIs.
- Reject unnecessary public methods on generic services used by only one internal consumer; prefer a
  private capability when the contract has no second real consumer.
- Follow every denial or limit to the operation that enforces it. Schemas, prompts, facades, and
  wrappers are not enforcement if a direct or alternate caller can bypass them.
- Verify derived state, notifications, caches, replays, and user-visible views share an authoritative
  source and publish only after the relevant operation succeeds.
- For an invariant, observe the actual runtime state and event relationship; presence, metadata, side
  effects, or a fixed example alone is not proof. An intentionally empty invariant hook is acceptable
  only when no plausible runtime relationship exists and the reason is documented; do not invent a
  synthetic check.
- Require tests to fail for the intended regression and observe behavior, external state, logs, events,
  or disposal rather than merely restating implementation details.
- Verify evidence for every applicable project-mandated local check, that every declared applicable
  local gate actually ran, and that CI covers the project's exhaustive matrix; review gaps detect
  neither on their own.

## Inspect affected surfaces

- **Interfaces and configuration:** confirm defaults, error distinctions, wire fields, events, and
  public behavior match the owning source and documentation; same-change README or JSDoc updates are
  required when public defaults, errors, wire fields, events, or behavior change; do not treat a documentation update alone
  as proof. Require current-consumer evidence or established prior art for new defaults, operations,
  formats, and newly imported external concepts or terms, or explicitly defer them until that evidence
  exists.
- **Lifecycle and concurrency:** trace ownership before reentry, cancellation, readiness, rollback,
  independent error reporting, detach cleanup, and dispose-to-quiescence.
- **Real entry path:** ensure tests exercise the shipped CLI, loader, worker, bridge, subprocess, or
  other production entry path when that path is affected; a hand-mounted substitute is weaker evidence.
  When loaders or plugins are affected, test malformed export shapes and named/default-export contracts
  through the shipped loader.
- **Bounds and output:** locate the owner of the complete emitted or retained result, including wrappers
  and metadata. Probe exact, tiny, oversized single chunks and oversized complete results, plus multibyte
  limits when they matter.
- **Model or user-visible behavior:** inspect the exact prompts, schemas, results, diagnostics, and UI
  text exposed in each affected mode. Flag model-facing concepts outside the model's task, not only
  malformed output. Treat stable wording as behavior and require snapshots or another concrete
  observation when appropriate.
- **Negative controls:** exercise a deliberately invalid case through the real runner when a rule,
  permission, invariant, or rejection is part of the change. Confirm invalid observations are rejected
  before publication where the contract requires it.
- **Bilingual and generated artifacts:** compare meaning and terminology on both sides; inspect the
  owning generator or source before accepting a generated derivative. Treat UI text and other visible
  wording as behavior and require the relevant snapshot or runtime evidence.

Update any declared canonical type or vocabulary catalog when a public seam or spine terminology changes;
internal-only types are exempt.

Distinguish borrowed from owned values and trace prompt, UI-echo, and query consumers to the
authoritative success point. When a proposed Agent Note was implemented by the change, move or rewrite
it as present-tense shipped state, and verify its paths and mechanisms. A disagreement is a design
discussion, not an automatic review veto.

## Report findings

State the defect, exact location, impact, and concrete evidence. Put a localized defect on the tightest
relevant line range; use the review summary for cross-cutting architecture, scope, or evidence gaps.
Separate blockers from suggestions, omit issues already disproven by a relevant green gate, and verify
every claim before accepting or rebutting it. If a rewrite changed the reviewed range, re-audit open
threads, approvals, mergeability, and checks instead of carrying forward stale conclusions.
