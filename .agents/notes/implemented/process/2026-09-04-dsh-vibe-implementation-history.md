# Agent Note: dsh-vibe implementation history

Status: implemented

## Problem

Decision-level history was kept in a standalone changelog under `docs/`, separate from the Agent Note
discipline. That split made rationale and alternatives harder to find and encouraged changelog entries
to become a second source of architectural truth.

## Decision

The decision history is maintained here as a concise timeline; fine-grained changes remain in Git:

- **2026-09-03 — v1.0:** scope fixed as an explicit per-project initializer; global installation retired;
  marker blocks, notes skeleton, content addressing, conflict protection, idempotent upgrade, status,
  and audit were established.
- **2026-09-04 — M1b:** `docGates` became a managed project toolchain. `spec.json` declares scaffold,
  hooks, base, text-link, doc-budget, bilingual, and extras groups; enabled groups are materialized and
  the consumer `package.json` is assembled deterministically.
- **2026-09-04 — repository/docs convergence:** plugin sources moved to the repository root, project
  docs were consolidated under `docs/`, and the public README became the user entry point. Design and
  history were then moved into Agent Notes so the docs tree keeps stable contract and evidence pages.

M3 (2026-09-04) made `@maocili/dsh-vibe` a public npm package with a DSH bundle patch,
package-local runtime content, and tarball/consumer regression coverage. Open work remains DP-G
(self-installed skill detection).

## Alternatives considered

**Keep a conventional `docs/CHANGELOG.md`.** It is familiar, but separates history from the decision
record and cannot require the Agent Note rationale format.

**Record every commit in this note.** That would duplicate Git and make the note noisy; only milestones
and decisions belong here.

**Delete history entirely.** This would lose context needed to understand scope boundaries and pending
work, so a concise milestone record is retained.

## Consequences

The former changelog is now a pointer to this note. Future milestone or scope changes update this note
and its Chinese counterpart in the same change; detailed file-level history is intentionally delegated
to Git.
