---
name: pre-push-checks
description: Use before pushing, force-pushing, requesting review, or claiming checks pass for a project change.
---

# Run Pre-Push Checks

Complete this procedure before pushing, force-pushing, requesting review, or claiming that checks pass. Read the [root rules](../../../AGENTS.md) before executing it. Do not push or claim readiness until the base ref, outgoing scope, selected commands, commit, and remote result are recorded.

This skill is portable. Use a command only after the condition in this document confirms that the project provides it. If a required value or command cannot be resolved, stop and report the missing value; do not guess a ref, script, package manager, test target, or hook result.

## 1. Resolve checkout, branch, and base

Run these commands from the repository root:

```sh
git status --short --branch
git rev-parse --show-toplevel
git branch --show-current
git remote
```

Set `BASE_REF` with exactly one branch below:

- For a GitHub PR, run `gh pr view --json baseRefName --jq '.baseRefName'`, fetch the printed branch with `git fetch <base-remote> <base-branch>`, and set `BASE_REF=<base-remote>/<base-branch>`. Use the remote that points to the PR base repository; do not assume `origin` for a fork.
- Without a GitHub PR, run `git rev-parse --abbrev-ref --symbolic-full-name '@{u}'`. Fetch the printed upstream with `git fetch <remote> <branch>` and set `BASE_REF` to the printed upstream ref.
- If both commands fail, stop and ask for the base ref before selecting tests or pushing.

The angle-bracket values above must be replaced by values printed by the preceding command. They are not valid literal arguments.

## 2. Produce the complete scope

If `package.json` exists, print the package manager and scripts. If it does not exist, skip this command and use the fallback scope set below:

```sh
node -e "const p=require('./package.json'); console.log(JSON.stringify({packageManager:p.packageManager ?? null, scripts:p.scripts ?? {}}, null, 2))"
```

Resolve `PACKAGE_MANAGER` before running a package script: use the executable prefix from `package.json#packageManager` when present (`pnpm@...` becomes `pnpm`, `npm@...` becomes `npm`, and `yarn@...` becomes `yarn`); otherwise use `pnpm` for `pnpm-lock.yaml`, `npm` for `package-lock.json`, and `yarn` for `yarn.lock`. If more than one lockfile exists or no value can be resolved, stop and report the package-manager ambiguity.

If `scripts.change-scope` exists, run exactly one matching command below with the resolved `BASE_REF`:

```sh
pnpm --silent run change-scope --base "$BASE_REF"
npm run change-scope -- --base "$BASE_REF"
yarn run change-scope --base "$BASE_REF"
```

Run only the line matching `packageManager`; if no line matches, stop and report that the declared scope script has no supported package-manager command. Preserve the command's structured output and inspect committed, staged, unstaged, and untracked categories.

If `scripts.change-scope` does not exist, run this fallback set:

```sh
git diff --name-status "$BASE_REF...HEAD"
git diff --name-status
git diff --cached --name-status
git ls-files --others --exclude-standard
```

The fallback output is the complete scope. Untracked paths are mandatory input even though ordinary diffs omit them. After a merge or rebase changes the base, rerun the scope command before selecting commands again.

## 3. Resolve project gates and hook ownership

Using the `PACKAGE_MANAGER` resolved in step 2, list the files that can declare gates:

```sh
git config --get core.hooksPath || printf '.git/hooks\n'
git ls-files -- package.json pnpm-workspace.yaml pnpm-lock.yaml package-lock.json yarn.lock Makefile justfile Taskfile.yml lefthook.yml .lefthook.yml .husky .github/workflows
```

If `core.hooksPath` is empty, inspect `.git/hooks/pre-commit` and `.git/hooks/pre-push`. Otherwise inspect `<hooks-path>/pre-commit` and `<hooks-path>/pre-push`:

```sh
HOOKS_PATH="$(git config --get core.hooksPath || printf '.git/hooks')"
for hook in "$HOOKS_PATH/pre-commit" "$HOOKS_PATH/pre-push"; do
  test -f "$hook" && { printf '\n--- %s ---\n' "$hook"; sed -n '1,220p' "$hook"; }
done
```

Create a gate list with one command per changed path category. A declared hook owns a check only when its inspected body invokes that check. Do not run a check manually if the same unchanged check will run in the next hook.

## 4. Execute the path-to-command matrix

Run every row whose path condition matches the complete scope. For each row, use the exact command declared by the project. If the command is absent or unavailable, record `unavailable: <command>`. Stop before pushing if root rules, CI configuration, or hook configuration declares that command mandatory. Continue only when none of those sources declares it mandatory, and report the gap.

- **Source or test files:** run the owning focused test file. For a Vitest project with a known test file, run `<package-manager> exec vitest run <test-file>` using the resolved package manager. If the owning test file is unknown, run `<package-manager> exec vitest related <changed-source> --run` and inspect the selected files before accepting the result.
- **Coverage:** test selection and coverage selection are separate. For a Vitest project, run both the owning tests and the affected source scope:

```sh
<package-manager> exec vitest run packages/<group>/<package>/tests/<behavior>.spec.ts \
  --coverage \
  --coverage.include='packages/<group>/<package>/src/**/*.ts'
```

  Replace every angle-bracket value with a path from the scope and owning test map. Repeat `--coverage.include` for every affected source package. Apply the repository's configured per-file thresholds; do not add `--passWithNoTests`, lower thresholds, or exclude an affected file.
- **Markdown, Agent Notes, catalogs, or documentation comments:** if `scripts.doc-sync` exists, run `<package-manager> run doc-sync`; otherwise run the exact documentation command declared by the project. If no documentation gate is declared, record `documentation gate: unavailable`.
- **Package metadata, exports, build configuration, workers, bins, or distribution paths:** if `scripts.build` exists, run `<package-manager> run build`; then run `<package-manager> pack --dry-run` and the package's exact declared artifact smoke command.
- **Provider, process, agent, CLI, terminal, or model behavior:** if `scripts.test:e2e` exists, run `<package-manager> run test:e2e`; otherwise run the exact integration command declared by the project. Do not print credentials.
- **Repository-wide or CI-only behavior:** run the full local suite only when the diff crosses the repository boundary, the user explicitly requests it, or the full suite is required to diagnose a CI failure.

Do not rerun a passing command merely because a commit or push follows. Rerun it only after the scope, source, configuration, or command inputs change. Replace `<package-manager>` with the `PACKAGE_MANAGER` value resolved in step 2; it is a placeholder, not a command.

## 5. Protect rewritten history

Before a standalone rebase or other history rewrite, record the exact remote OID:

```sh
git fetch <remote> <branch>
OBSERVED_OID="$(git rev-parse <remote>/<branch>)"
printf '%s\n' "$OBSERVED_OID"
```

Publish the rewritten branch only with the recorded lease:

```sh
git push --force-with-lease=<branch>:<observed-oid> <remote> <branch>
```

Replace all angle-bracket values with the remote and branch used in the preceding commands. Never use raw `--force`.

For `gh stack sync`, require an empty `git status --porcelain`, record `git branch -r` and the official stack order before syncing, run `gh stack sync`, then run `git fetch --all --prune`, repeat `git branch -r`, re-query every rewritten PR head, inspect every layer against its live base, and execute step 4 for every affected layer. Keep every PR unmerged until all layer checks pass.

## 6. Commit and verify an ordinary push

Complete the checks before committing. Then run:

```sh
git add <intended-path-1> <intended-path-2>
git diff --cached --check
git commit -m "<change description>"
test -z "$(git status --porcelain)"
```

Replace the angle-bracket paths with every intended path from step 2 and replace the message with the actual change. If the worktree is not clean after commit, inspect the fixer output and commit the intended follow-up before pushing.

For an ordinary push, resolve the push remote and branch from the configured upstream, then run:

```sh
git push <remote> <branch>
git fetch <remote> <branch>
test "$(git rev-parse HEAD)" = "$(git rev-parse <remote>/<branch>)"
```

For a GitHub PR, run `gh pr checks` after the push and report each check as `pending`, `pass`, or `fail`.

## 7. Handle failures

If any required command exits nonzero, stop before pushing. Report the exact command, exit result, affected path category, and remaining gap. Distinguish environment or credential failures from product failures; never claim a credential-dependent check passed when it did not run.

For a post-sync failure, keep the lease-protected published heads, repair the failing layer, rerun its step 4 commands, and publish the correction. A successful `gh stack sync` command is not validation.
