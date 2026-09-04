---
name: merge-stacked-prs
description: Use when landing dependent GitHub pull requests that use GitHub's official stacked pull request support.
---

# Merge a GitHub Pull Request Stack

Use only when GitHub's official stack capability is available. Read the project merge policy, use a clean dedicated worktree, and fetch live PR metadata and head commits before changing remote state.

Require the official stack object as membership authority; never recreate stack behavior through manual merge and retarget operations. Verify order, review state, required checks, and mergeability for every layer. Merge through the stack operation and re-read the result. If stack support, authorization, or required checks are missing, stop and report the prerequisite.
