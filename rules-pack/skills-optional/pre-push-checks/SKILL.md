---
name: pre-push-checks
description: Use before pushing, force-pushing, requesting review, or claiming checks pass for a project change.
---

# Run Relevant Pre-Push Checks

Run relevant local evidence once before a push, force-push, review request, or claim that checks pass. Read the [root rules](../../../AGENTS.md), project hooks, CI policy, package scripts, and declared commands; they define the required checks, platform coverage, and repository-specific scope command.

This skill is portable. Prefer a project's declared commands and automation when they exist, but never invent a command such as `change-scope`, `doc-sync`, or `vitest` for a project that does not provide it.

## Inspect the outgoing change

1. Confirm the checkout, branch, and worktree before choosing evidence:

```sh
git status --short --branch
git rev-parse --show-toplevel
git branch --show-current
```

2. Verify the live PR base, remote branch, or stack parent. Do not guess a comparison base. Fetch the verified ref when the project permits it.

3. If the project declares a dedicated scope reporter, use it as the source of truth with the verified base. Preserve its structured output and inspect every category it reports. Otherwise inspect committed, staged, unstaged, and untracked paths separately:

```sh
git diff --name-status <verified-base-ref>...HEAD
git diff --name-status
git diff --cached --name-status
git ls-files --others --exclude-standard
```

Untracked files do not appear in ordinary diffs. Include them in the scope when they affect the change or the claim. After merging or rebasing a changed base, recompute the scope and rerun only evidence invalidated by the new combined diff.

## Read local gates and hooks

Determine the commands from the project's package scripts, Makefile, task runner, CI configuration, and hook configuration. Treat a declared scope command as mandatory when its owning policy requires it. Use project-specific commands such as `pnpm run doc-sync`, `test:e2e`, or `pnpm run build` only when they are declared and the changed behavior reaches them.

Read pre-commit and pre-push hooks before running checks. Record which checks each hook owns, and do not manually repeat a passing hook check immediately before the hook runs. A pre-commit fixer may change files; inspect those changes before continuing. A check that passes does not complete the work until the intended change is committed.

## Select relevant evidence

Choose the narrowest available check that would fail for the regression:

- focused tests for code and adjacent tests when a shared contract changes;
- documentation, link, pairing, or generated-catalog gates for prose and notes;
- build, package, and artifact-smoke checks for manifests, exports, workers, bins, and distribution paths;
- integration or end-to-end checks for real providers, processes, or external behavior;
- the project-required full suite only for repository-wide changes, CI diagnosis, or an explicit request.

Test selection and coverage selection are separate. If the project uses Vitest, select the owning tests and explicitly include only the affected source scope when coverage is relevant:

```sh
pnpm exec vitest run packages/<group>/<package>/tests/<behavior>.spec.ts \
  --coverage \
  --coverage.include='packages/<group>/<package>/src/**/*.ts'
```

Use the project's package manager and test runner when they differ. Respect configured coverage thresholds; never lower them, add `--passWithNoTests`, or narrow coverage merely to hide an affected file. Dependency-graph commands such as `vitest related` are candidates, not proof, when behavior is loaded dynamically, runs in a worker or subprocess, or crosses an external provider.

Never expose credentials. Record unavailable credential-dependent coverage as a gap rather than claiming it passed.

## Protect rewritten history

Before a standalone history rewrite, fetch the verified remote branch and record its exact OID. Publish with a lease scoped to that OID:

```sh
git fetch <remote> <verified-branch>
git rev-parse <remote>/<verified-branch>
git push --force-with-lease=<verified-branch>:<observed-oid> <remote> <verified-branch>
```

Never use raw `--force`. For `gh stack sync`, require a clean worktree, record the official stack order and remote heads, then re-query every rewritten head, inspect every layer against its live base, and run the relevant evidence for each layer immediately afterward. Keep the PRs unmerged until all selected checks pass.

## Complete an ordinary push

1. Run the selected relevant checks once.
2. Commit the intended change normally. Inspect any files changed by the pre-commit fixer before continuing.
3. Push normally, or use the exact observed-OID lease for an authorized rewritten branch.
4. Verify the remote ref matches local `HEAD`:

```sh
git fetch <remote> <verified-branch>
git rev-parse HEAD <remote>/<verified-branch>
```

For a GitHub PR, inspect remote checks after pushing:

```sh
gh pr checks
```

Report pending checks as pending. Inspect failures before attributing them to the branch or the environment.

## Report and handle failures

Do not rerun a passing check merely because another commit or push follows unless the change invalidates it. If a relevant check fails, stop and fix or explain the blocker. For a post-sync failure, leave the lease-protected heads in place, repair the failure, validate the repair, and publish the correction; do not treat a successful sync command as proof that the stack is ready.

Report the exact command, result, and remaining coverage gap. Distinguish sandbox or environment evidence from a product failure. Do not push or claim readiness while a required check remains unresolved.
