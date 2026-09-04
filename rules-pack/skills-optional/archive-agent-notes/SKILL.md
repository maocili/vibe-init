---
name: archive-agent-notes
description: Use when adding, auditing, pruning, archiving, restoring, or reviewing Agent Notes in a project initialized by dsh-rules.
---

# Archive Agent Notes

Read `.agents/notes/README.md` and lifecycle instructions first. Judge notes by future decision value, never age or length. Keep implemented notes whose rationale, ownership rule, durable behavior, security boundary, or reintroduction condition remains useful. Never archive a proposal; reject obsolete proposals and delete rejected records only when they no longer prevent a plausible mistake.

For full supersession preserve unique rationale, alternatives, consequences, verification, and coverage gaps in the current owner; partial supersession keeps both records linked. Archive the complete English/Chinese/sidecar triplet into `archived/<class>/`, record an identical archive date, repair inbound links, seal it with the archive verifier, then run doc-sync. Never edit a sealed artifact or repair its outbound links.
