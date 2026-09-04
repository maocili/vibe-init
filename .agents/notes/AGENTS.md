# AGENTS.md — Agent Notes

Agent Notes are durable decision and proposal records (RFCs written by agents): they carry the
rationale, the alternatives rejected, and the required verification that code and prose cannot.
The complete rules live in [README.md](README.md); this file is the gate a session sees first.

- A non-trivial change MUST add or update an Agent Note in the same change. Non-trivial means it
  alters behavior, architecture, a contract shared across files or packages, process or tooling,
  testing strategy, an on-disk/wire/config format, or another decision a maintainer may revisit.
  Purely mechanical or local edits are exempt.
- A new note starts in proposed/ while unbuilt (or partly built) and moves to implemented/ once the
  decision ships; implemented/ notes are kept current with what actually shipped (facts only — paths,
  names, defaults — not the decision itself). rejected/ keeps only verdicts whose rationale prevents
  a tempting mistake.
- Every new note triggers a supersession check: search the active tree for older notes on the same
  decision or mechanism. Full supersession is consolidated into the owning note (every unique
  rationale, alternative, consequence, and verification preserved; inbound links repaired) and the old
  note deleted with its sibling records. Partial supersession keeps both notes active and cross-linked.
- Every note follows one format: the first three lines are exactly

```markdown
# Agent Note: <title>

Status: <proposed | implemented | rejected — why, in one line>
```

  the body opens with ## Problem, and every note carries ## Alternatives considered.
- Cross-references between notes use relative markdown links (no bare prose), so they are checkable
  and survive moves between folders. Do not keep a centralized index.
- Files under archived/ are frozen historical snapshots: never edit, translate, reformat, move, or
  treat them as current authority.
