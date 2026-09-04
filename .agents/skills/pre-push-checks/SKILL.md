---
name: pre-push-checks
description: Use before pushing, force-pushing, requesting review, or claiming checks pass for a project change.
---

# Run Relevant Pre-Push Checks

Run relevant local evidence once before a push, force-push, review request, or claim that checks pass. Read the [root rules](../../../AGENTS.md), project's hooks, CI policy, and declared commands; they define mandatory checks and platform coverage.

## Inspect the outgoing change

Confirm the checkout, working tree, and comparison base from live remote or stack state. Inspect the complete outgoing diff, including staged, unstaged, untracked, and committed changes where they affect the claim. Reassess the scope after merging or rebasing a changed base.

## Select evidence by changed behavior

Choose the narrowest available check that would fail for the regression:

- focused tests for code and adjacent tests when a shared contract changes;
- documentation, link, pairing, or generated-catalog gates for prose and notes;
- build, package, and artifact-smoke checks for distribution paths;
- integration or end-to-end checks for real providers, processes, or external behavior;
- the project-required full suite only for repository-wide changes, CI diagnosis, or an explicit request.

Test selection and coverage selection are separate. Broaden evidence only when the diff reaches shared contracts, repository-wide behavior, or an explicit project policy. Never expose credentials; record unavailable credential-dependent coverage as a gap rather than claiming it passed.

## Protect rewritten history

Before a standalone history rewrite, fetch and record the remote branch tip, then use `--force-with-lease` scoped to that observed tip. Never use raw `--force`. For a native stack sync that must publish rewrites before local validation, require a clean worktree, confirm the stack order and remote heads, then inspect and validate every rewritten layer immediately afterward.

## Report and handle failures

Do not rerun a passing check merely because another commit or push follows unless the change invalidates it. On failure, distinguish sandbox or environment evidence from a product failure, retry only when the project policy permits it, and report the exact command, result, and remaining coverage gap. Do not push or claim readiness while a required check remains unresolved.
