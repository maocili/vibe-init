---
name: find-simplifications
description: Use when finding evidence-backed simplification candidates or writing a simplification Agent Note.
---

# Find Simplifications

Read owning architecture, tests, and active Agent Notes before treating complexity as accidental. Strong candidates remove duplicated representations, unused public surface, speculative configuration, dead compatibility paths, redundant state, or hand-rolled code fully replaced by a maintained dependency or platform primitive.

For each candidate search production consumers separately from tests, docs, fixtures, and generated artifacts, then read call sites. Reject candidates justified by a current consumer, durable format, or active decision record. Measure net deletion rather than moving complexity behind a wrapper. Record substantial work in `proposed/simplification/`; use TODO only for local low-risk cleanup.
