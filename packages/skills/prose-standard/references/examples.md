# Prose calibration examples

Use these examples to identify the principle, not as templates.

## Preserve factual clauses

**Weak:** “The coordinator handles persistence.”

**Complete:** “The coordinator serializes writes per session, flushes buffered events before disposal resolves, and reports backend failures to the caller.”

Do not shorten away scope, timing, or failure visibility.

## Keep the local contract

**Weak:** “See the lifecycle note.”

**Complete:** “Disposal aborts the run and waits for provider quiescence. See the lifecycle note for ownership rationale.”

A link carries extended rationale; it does not replace behavior a caller needs at the use site.
