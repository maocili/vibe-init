# Agent Note: Skill authoring standard

Status: implemented

## Problem

Without a shared authoring standard, a Skill can become a broad, narrative prompt whose metadata is
too vague to route the task and whose body leaves execution choices implicit. That increases prompt
cost, encourages duplicate Skills, and makes failures difficult to verify or hand back to the user.

## Decision

Skill authoring separates two contracts: concise metadata routes a task, while the body instructs the
matched agent how to execute it. The [prose standard](../../../skills/prose-standard/SKILL.md) governs
clarity and removal of reasoning leakage; this note adds the Skill-specific routing and execution
boundaries. During maintenance, compare each changed packaged workflow with its corresponding reference
template, retain portable constraints and executable checks, and generalize repository-specific paths
or policies instead of copying them blindly.

### Metadata is the routing contract

The default project-local file is `.agents/skills/<skill-name>/SKILL.md`. Its YAML frontmatter MUST
contain `name` and `description`:

```yaml
---
name: api-debugging
description: Diagnose API failures in this repository, identify the owning package, and verify fixes with the smallest relevant checks.
---
```

- `name` uses kebab-case and identifies one coherent task domain.
- `description` states what task the Skill handles and when it applies. It is not a slogan and does
  not contain the complete workflow.
- `whenToUse` is optional and is added only when an extra matching condition materially improves
  routing.
- `disable-model-invocation` and `user-invocable` are set deliberately for the intended invocation
  surfaces. If a Skill has product-specific invocation metadata, that metadata MUST agree with the
  frontmatter policy.

Keep routing metadata short enough to work as a directory entry. Do not move execution detail into it
to avoid writing the body.

### The body is the execution contract

After a match, the body MUST let another agent act without guessing the important steps. It should
state the scope, prerequisites, ordered workflow, conditional branches, failure handling, verification
evidence, and limitations. A useful default shape is:

```markdown
# API Debugging

## Scope

## Preconditions

## Workflow

## Verification

## Limitations
```

The body is for rules and decisions, not a concept essay. Prefer direct instructions such as “Read the
registered Service interface before writing the call; do not infer its method signature from its name.”
State what to inspect first, how to choose the next action, which files or tools may be changed or
called, what to do when a prerequisite is missing, and when to stop and report uncertainty. Include the
smallest relevant checks and the observable result that counts as success.

### Boundaries and progressive disclosure

Keep one Skill focused on one task domain. Split independent topics into separate Skills; if they must
remain together, state explicit in-scope and out-of-scope cases in the body. Do not use a catch-all
description such as “Handle all development tasks.”

The directory view exposes only `name` and `description`; the full body is loaded after the Skill
matches. Therefore the description MUST be sufficient for routing, the body MUST NOT repeat the
frontmatter, and references, scripts, and assets SHOULD be cited and loaded only when the workflow
needs them. Do not enumerate unrelated resources in the routing surface.

### Authoring and review rules

Remove background stories, repeated rules, decorative prose, and process narration. Preserve behavior
constraints, ownership, timing, exceptions, failure consequences, and compatibility promises. Treat
invocation metadata and visible diagnostics as behavior. When a required platform interface, command,
permission, or input cannot be resolved, the Skill MUST say how to report the gap; it MUST NOT instruct
the agent to guess.

## Verification

A new or materially changed Skill is ready when all of the following are true:

1. A reader who sees only `name` and `description` can decide whether the Skill matches the task.
2. A matched agent can execute the workflow without inventing a key step, command, interface, or
   success condition.
3. Each meaningful branch names its trigger, action, failure handling, and stop condition.
4. The Skill states its limitations and non-goals, and its checks produce concrete evidence.
5. The body contains no duplicated frontmatter, reasoning transcript, or unrelated resource catalog.
6. The relevant frontmatter parser, invocation-policy check, documentation gate, and task-specific
   checks pass; report only checks that were actually run.

## Alternatives considered

**Put the complete procedure in `description`.** Rejected because routing metadata becomes expensive,
hard to scan, and difficult to evolve independently from execution instructions.

**Expose one broad development Skill.** Rejected because weak matching and unrelated branches make the
Skill harder to invoke correctly and encourage conditional prose that belongs in separate Skills.

**Write a narrative introduction before the rules.** Rejected because process commentary and background
delay the actionable contract and can expose reasoning without defining a required behavior.

**Load every reference, script, and asset with the directory entry.** Rejected because progressive
disclosure depends on keeping the catalog small and loading supporting material only when the matched
workflow needs it.

## Consequences

Future Skills use frontmatter as a small, stable routing surface and the body as an executable,
bounded workflow. Reviews can check matching quality separately from procedural completeness, and
failure reports can point to a named missing prerequisite or verification result. Packaged workflow
changes are compared against their reference templates before completion; Harness-only facts are
generalized or omitted. The packaged `archive-agent-notes` workflow demonstrates the multi-mode split:
its entrypoint retains shared authority and routing, while supersession, retention calibration, and
sealing mechanics live in references loaded only for the matching operation. Adding a new Skill or
changing its invocation policy remains a process change:
update the relevant Skill metadata and sidecar, run the applicable gates, and keep any product-specific
runtime contract in its owning source or decision record rather than duplicating it here.
