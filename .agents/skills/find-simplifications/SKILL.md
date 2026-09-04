---
name: find-simplifications
description: Use when finding evidence-backed simplification candidates or writing a simplification Agent Note.
---

# Find Simplifications

Read owning architecture, tests, public documentation, and active Agent Notes before treating complexity as accidental. A simplification removes owned code, behavior, state, or surface area; moving it behind a wrapper is not enough.

## Find strong candidates

Look for duplicated representations, unused public surface, speculative configuration, dead compatibility paths, redundant state, added-then-removed layers, and hand-rolled code that a maintained dependency or platform primitive can wholly replace. Inspect lifecycle and trust boundaries separately: cleanup, persistence, privilege, parsing, and cancellation often make apparent duplication necessary.

Use `rg` to find exact symbols, configuration keys, wire values, and their call sites. Search production consumers separately from tests, documentation, fixtures, generated artifacts, and dynamic loading paths. A static-analysis report is a lead, not proof.

## Prove or reject each candidate

For each candidate, identify the current consumer, durable-format obligation, active decision record, and required behavior it would remove. Reject it when any remains justified. Prefer evidence of net deletion, simpler ownership, fewer states, or a removed compatibility promise over aesthetic arguments. If replacing code with a dependency, establish maintenance, fit, license, deployment, and failure-mode evidence first.

## Record and validate

Write substantial, accepted candidates as `proposed/simplification/` Agent Notes; link partial supersessions and use `archive-agent-notes` for retention judgment. Use a TODO only for local, low-risk work with a clear owner. For work taken from another branch, compare it against its verified independent base, then validate its contribution as part of the combined change. Run the narrowest checks that demonstrate removed behavior is absent and retained behavior still works.
