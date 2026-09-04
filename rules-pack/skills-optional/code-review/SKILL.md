---
name: code-review
description: Use when reviewing a pull request or change in a project initialized by dsh-rules.
---

# Review a Change

Read applicable root and subtree `AGENTS.md` files, owning code and docs, and active Agent Notes. Verify the live comparison base and inspect enough surrounding code to trace changed interfaces and behavior.

Prioritize correctness, security, lifecycle, ownership, missing required behavior, and missing evidence over style. Verify that documentation, configuration, public contracts, generated artifacts, and Agent Notes change with the behavior they describe. Report findings with location, impact, and concrete evidence; separate blockers from suggestions and omit issues already proven by a relevant green gate.
