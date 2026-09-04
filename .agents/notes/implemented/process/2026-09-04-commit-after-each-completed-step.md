# Agent Note: Commit after each completed step

Status: implemented

## Problem

A multi-step agent session can finish several independently verifiable changes while leaving them in one uncommitted batch. That weakens traceability and makes it harder to isolate, review, or revert one completed step.

## Decision

The project standing orders require one Git commit immediately after each independently verifiable step. A step is one implementation, documentation, configuration, or test change with a clear result; it may span the files needed for that result. The applicable checks run before the commit, and multiple completed steps do not share one commit. The [standing rule](../../../../rules-pack/standing-orders-block.md) is the source for generated projects.

## Alternatives considered

**Commit only at the end of the whole task.** Rejected because it hides completed boundaries and makes partial recovery needlessly broad.

**Commit every command or individual file edit.** Rejected because those are not necessarily independently verifiable steps and would create noisy, meaningless history.

## Consequences

Agents must identify the step boundary before acting, run its applicable checks, and commit once that boundary is complete. A step that cannot yet be verified remains in progress instead of receiving a completion commit. One step may still include coordinated source, test, documentation, and generated-content updates when they form one verifiable result.
