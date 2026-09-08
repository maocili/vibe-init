# Agent Note: worktree-local Git hooks

Status: implemented

## Problem

The consumer toolchain installed one repository-wide pre-commit documentation gate through Git's default hooks directory. It did not distinguish targeted local evidence from hook checkpoints and CI coverage, and linked worktrees could overwrite one another's generated hook launchers. Existing hook paths, concurrent installs, and a failed Lefthook process also lacked ownership-aware protection and rollback.

## Decision

The managed root instruction points to the portable `pre-push-checks` skill for selecting the smallest project-declared evidence that covers the complete outgoing change. Hooks remain narrower: pre-commit checks staged whitespace and applicable archive or bilingual pairing integrity, pre-merge repeats the integrity checks, and pre-push runs the configured documentation aggregate. Exhaustive and platform-matrix coverage remains CI-owned when the consumer project provides CI.

The consumer postinstall generates `lefthook.yml` from the enabled toolchain scripts and refreshes it only while its leading marker proves vibe-init ownership. A foreign or non-regular config is never overwritten. Each worktree receives an absolute hook directory under its own Git directory and a worktree-scoped `core.hooksPath`; the installer enables Git worktree configuration only after rejecting dormant settings and unsupported repository states. Inherited custom hook paths require `VIBE_INIT_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE=1`, which masks the path only in the current worktree. Command-scoped and custom worktree-scoped paths are never replaced.

An ownership record protects the reserved hook directory, and a PID/UUID lock in the common Git directory serializes installs. Stale or malformed locks require explicit recovery. Installation removes command-scoped Git configuration from Lefthook's environment and rolls back the current worktree hook path and generated config when Lefthook fails. Safe repository-format and worktree-extension migration is monotonic and is not rolled back. Disabling `docGates` retains the existing manual hook cleanup behavior.

## Alternatives considered

**Run every available check in pre-commit.** This gives early feedback but makes commits pay for unrelated repository-wide work and duplicates CI evidence.

**Use the common Git hooks directory.** This is simpler but lets one linked worktree install launchers that resolve another worktree's files and dependencies.

**Replace existing hook paths automatically.** This would make installation convenient at the cost of silently discarding user-owned hook behavior. The explicit current-worktree override preserves intent without changing sibling worktrees.

**Delete stale locks and unknown hook directories automatically.** Process identifiers can be reused and unknown files can be user-owned, so recovery remains explicit when ownership cannot be proved.

## Consequences

Initialized projects receive predictable local checkpoints without treating hooks as complete verification. Hook installation can upgrade a non-bare repository to Git repository format 1 and enable `extensions.worktreeConfig`; subsequent installs remain isolated and idempotent. Consumers with foreign Lefthook configuration must merge the printed jobs themselves. The installer and generated configuration remain managed package content, so changes require manifest hash refresh and integration coverage against real temporary Git worktrees.
