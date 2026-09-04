---
name: merge-stacked-prs
description: Use when landing dependent GitHub pull requests that use GitHub's official stacked pull request support.
---

# Merge a GitHub Pull Request Stack

Use only when GitHub's official stack capability is available. Read the project merge policy, use a clean dedicated worktree, and fetch live pull-request metadata and head commits before changing remote state.

## Require native stack support

Verify that `gh stack` and the server-side feature are available before acting. Every head branch must be in the same repository. If native stack support, authorization, a clean worktree, or an eligible same-repository chain is missing, stop and report the prerequisite. Do not recreate stack behavior through individual merge and retarget operations.

## Establish membership and order

Treat the official stack object as the membership authority. Confirm the default branch, bottom-to-top order, current remote heads, and whether the request covers the whole stack or an explicit prefix. Link an unstacked chain only when its verified order is unambiguous; never dissolve, reorder, or rebuild an existing stack automatically.

## Refresh and preflight

Use the native checkout, sync, rebase, and push commands only when their preconditions hold. A sync may rewrite and publish branches before local validation; inspect every affected layer immediately afterward, run the relevant checks, and do not claim readiness until they pass. Stop for divergent local and remote compositions rather than deleting or recreating remote state.

Before merging, verify each selected layer's review state, required checks, mergeability, and dependencies. Re-read live metadata after a retarget, rebase, or failed operation.

## Merge and verify

Submit the whole stack or explicitly bounded prefix through the native stack merge operation. Re-read the landed state, verify the expected base and head relationships, and report the selected boundary, checks observed, merge result, and any remaining layers. Do not make publication, merge, or remote-rewrite actions without the user's authorization for that action.
