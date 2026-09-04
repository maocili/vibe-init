---
name: merge-stacked-prs
description: Use when landing dependent GitHub pull requests through the official stacked-PR capability, including requests that mention stacked PRs, PR stacks, or dependent PR chains; stop on unsupported, ambiguous, cross-repository, or unsafe states.
---

# Merge a GitHub Pull Request Stack

Use GitHub's native stack object and merge operation. Do not reproduce stack semantics by merging and
retargeting individual pull requests. Read the root rules and project merge policy, use a clean
dedicated worktree, and fetch live pull-request metadata and exact head commits before changing remote
state. Use [pre-push-checks](../pre-push-checks/SKILL.md) for supplemental local evidence selection.

## Require native stack support

Run `gh stack --version` before changing GitHub state. Hard-stop when the official extension or
server-side stack feature is unavailable, when authorization is missing, when the worktree is dirty, or
when any head branch belongs to another repository or fork. Never fall back to manual merge and
retarget operations.

Fetch every selected PR with the project's GitHub CLI and record the live base, head, author, review,
mergeability, draft, state, and status-check fields:

```sh
gh pr view <pr> --json number,author,baseRefName,baseRefOid,headRefName,headRefOid,isCrossRepository,state,isDraft,reviewDecision,mergeStateStatus,statusCheckRollup
```

## Establish membership and order

Query the official stack object for at least one PR in each apparent chain. Treat it as the membership
authority, not base-branch inference alone. Paginate entries when the API returns a page limit:

```sh
gh api graphql -F owner=<owner> -F name=<repo> -F number=<pr> -f query='
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      number
      author { login }
      baseRefName
      headRefName
      stackEntry { position }
      stack {
        number
        baseRefName
        size
        entries(first: 100) {
          nodes {
            position
            pullRequest { number author { login } baseRefName headRefName state isDraft }
          }
        }
      }
    }
  }
}'
```

When the result reports `hasNextPage`, repeat the query with `after: endCursor` until all pages are
collected, then require the returned entry count to equal the stack's declared `size`. Do not treat the
first page as complete evidence.

Confirm the default branch, bottom-to-top order, current remote heads, and whether the request covers
the whole stack or an explicitly bounded prefix. The bottom PR targets the trunk and each higher PR
targets the head branch immediately below it.

## Link missing members

Compare the existing official entries with the expected chain before any mutation. Multiple stack
numbers, an unexpected entry, an order conflict, or a partial chain that is not unambiguous requires
user direction. If a verified chain is not yet linked, compare every `author.login` exactly and use the
native command only when all authors match:

```sh
gh stack link --base <trunk> <bottom-pr> <next-pr> ... <top-pr>
```

If authors differ or an author is unavailable, ask before linking. Re-query the stack and require one
stack number, the expected trunk, the complete PR set, and the expected positions and base chain. Never
use `gh stack link` to remove or unstack entries: linking is additive, and merged or queued entries
cannot be unstacked. Never dissolve, reorder, or rebuild an existing stack automatically.
After any failed link, sync, or merge mutation, fetch fresh stack and PR metadata before retrying or
reporting the result.

## Refresh only when needed

Do not rewrite branches merely because a refresh mechanism exists. When live merge state or repository
rules require an update, use the native checkout/sync/rebase flow or the project-approved incremental
merge-forward flow. A sync can rewrite and publish every active layer before local validation:

- inspect every affected layer immediately after the operation;
- run the relevant checks for every affected layer;
- propagate review fixes from a lower layer through each dependent layer and re-check the affected
  review state;
- stop on a rebase conflict or divergent local/remote composition and ask rather than deleting or
  recreating remote state. Publish rewritten heads only with a lease-protected or equivalent
  compare-and-swap update, never an unconditional overwrite; and
- after any rewrite, re-fetch exact heads and re-audit review threads, approvals, mergeability, and
  checks. Never use raw `--force` or overwrite a concurrently advanced head.

For an incremental merge-forward race, preserve the current checkpoint if the base advances before the
newer tip is incorporated; re-read the new base and continue from that checkpoint rather than silently
discarding it. Successful validation of every affected rewritten layer is a gate: do not merge or claim
readiness while any such check is failing or missing.

For a native refresh, check out the affected stack, synchronize its base, rebase or sync layers from
bottom to top, run each layer's checks, and publish each rewritten head with the project's
lease-protected push flow. For incremental merge-forward, advance the bottom layer first, then
incorporate each newer bottom head into the next layer in order, validating and publishing at every
checkpoint.

## Preflight and merge

Re-query the official stack immediately before merging. Require every selected PR to be open, non-draft,
in the expected order, mergeable, and compliant with the repository's review and check requirements.
Treat each layer independently; a ready top layer does not prove its dependencies are ready.

Merge the whole stack or the explicitly requested prefix through the native operation:

```sh
gh stack merge <stack-number> --yes --merge
gh stack merge <boundary-pr> --yes --merge
```

Use only the first form for a whole stack and the second for an explicit boundary. Do not pass
`--delete-branch`, issue per-PR merge commands, manually retarget dependents, or bypass merge
requirements. A direct stack merge is all-or-nothing for its selected range; a merge queue may split
that range into groups, so queue submission is not atomic landing evidence. A native blocker is resolved
through the owning PR or reported; it is not a reason to fall back to `gh pr merge`.

## Verify the landed state

Wait for every selected PR to report `MERGED`; queued or approved is not completion:

```sh
gh pr view <pr> --json number,state,mergedAt,mergeCommit,baseRefName,headRefName
```

For a partial landing, re-query the official stack and verify every remaining PR still has the expected
order and base relationship. Re-check current heads, review state, and CI after GitHub rebases a
remaining layer. Delete branches only in a separate final pass, after the PR is merged and GitHub
reports no open PR uses that branch as a base:

```sh
gh pr list --state open --base <branch> --json number --jq length
```

Anything other than `0` blocks deletion. Report the selected boundary, stack membership and order,
rewrites, checks, merge result, remaining layers, and branch-deletion decisions.
