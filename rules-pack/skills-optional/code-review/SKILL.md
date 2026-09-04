---
name: code-review
description: Use when reviewing a pull request or change in a project initialized by dsh-rules.
---

# Review a Change

This is guidance, not a substitute for understanding the changed system. Verify the live comparison base, inspect the complete diff, and read enough surrounding code, documentation, and active Agent Notes to trace affected behavior.

## Read the owning contracts

Read the [root rules](../../../AGENTS.md), applicable subtree `AGENTS.md` files, public interfaces, configuration, generated-source policy, testing policy, and [Agent Note rules](../../notes/README.md). For changed prose, apply [prose-standard](../prose-standard/SKILL.md); for paired documentation, review both languages even when the pairing verifier is green.

## Review required behavior

Prioritize correctness, security, lifecycle, ownership, missing required behavior, and missing evidence over style.

- Trace both sides of every changed interface, including errors, cancellation, disposal, data ownership, and compatibility promises.
- Check asynchronous setup, callbacks, processes, and teardown for publication races, cancellation during waits, cleanup, and quiescent disposal.
- Require a current owner and consumer for new abstractions, state, options, defensive copies, and compatibility paths. Challenge speculative generality.
- Follow each denial or limit to the operation that enforces it; schemas, prompts, facades, and wrappers are not enforcement if alternate callers can bypass them.
- Verify derived state, notifications, caches, and user-visible views share an authoritative source and are published only after the relevant operation succeeds.
- Review tests for a regression that fails for the intended reason and observes behavior rather than restating the implementation.

## Review the surrounding artifacts

Documentation, configuration, public contracts, generated artifacts, and Agent Notes change with the behavior they describe. Comments state non-obvious behavior, failure, ownership, timing, or safe use; they do not narrate code or review history. Treat model-visible and user-visible wording as behavior and require the repository's appropriate output evidence.

## Report findings

State each defect's location, impact, and concrete evidence. Put localized defects on the tightest relevant range and cross-cutting concerns in the review summary. Separate blockers from suggestions, omit issues already proven by a relevant green gate, and verify review claims before accepting or rebutting them.
