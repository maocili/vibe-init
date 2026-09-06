# Retention classification

Use this workflow to review, audit, or prune an explicit Agent Note scope. Determine for each rationale
whether it still owns or constrains current behavior before assigning an outcome.

## Classify by future decision value

- **Implemented — keep active:** retain rationale, alternatives, negative guarantees, durable or wire
  semantics, ownership rules, security rules, or reintroduction conditions likely to guide a future
  change.
- **Implemented — archive:** archive a completed decision whose body is unlikely to guide future work,
  such as a one-off interface choice, narrow adapter, closed minor bug, superseded implementation
  detail, or process history whose current behavior is obvious from maintained authority.
- **Proposed — keep or reject:** keep a live proposal active. Reject it instead of archiving it when it
  is no longer worth pursuing.
- **Rejected — keep as a guardrail:** retain a rejection while the losing idea remains a tempting,
  meaningful mistake and the note explains why it loses.
- **Rejected — delete:** delete the complete declared record when its premise is obsolete, a newer
  decision resolves it, or it is unlikely to prevent re-litigation.

## Calibrate analogous cases

Length does not determine retention. A short note can preserve a foundational durability rule; a long
note can describe a closed adapter that no longer informs a choice.

Typical implemented records to keep include storage or identity ownership, durable event semantics,
security constraints, and coordinated reintroduction conditions. Typical archive candidates include
minor completed interface behavior, one-off migration machinery, narrow adapters, and implementation
details superseded by a clearer current owner.

Keep a rejected record when a superficially simpler design remains tempting. Delete it when the
integration premise disappeared or a later active decision fully settled the question.

Apply one principle consistently to analogous groups. Record the reason and word count for genuinely
borderline outcomes, but do not force a quota or manufacture uncertainty. A review reports proposed
notes that should be rejected; it does not move them unless the user requested changes.
