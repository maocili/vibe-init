# Agent Note: Harness agents parity

Status: implemented

## Problem

The project rule pack carried a simplified Agent Note skeleton while its installed verifier still
required Harness-style lifecycle/class paths. Its bilingual-pair setting also documented a feature
without controlling the paired skeleton artifacts, leaving initialized projects with contradictory
instructions and behavior.

## Decision

The rule pack now uses the closed Harness-compatible Agent Note classes under each active lifecycle,
materializes their directory skeleton, and documents the same path model. `bilingualPairing` controls
the note README Chinese counterpart and sidecar; disabling it removes only unmodified managed copies.
The remaining Harness `.agents` workflow and skill parity work is delivered as project-local managed
content, never as a user-global installation. All eleven reusable skills are default-installed, with
their supporting metadata, examples, and the deterministic GIF encoder included as managed assets.

## Alternatives considered

**Flatten the verifier.** This would preserve the reduced documentation but discard a useful,
machine-checked classification taxonomy already implemented by the toolchain.

**Keep bilingual skeleton files unconditional.** A setting that cannot change materialization is
misleading and prevents monolingual projects from selecting an English-only note skeleton.

**Copy Harness paths and commands verbatim.** Those instructions bind to one repository's packages and
automation, so reusable rules instead discover the target project's own contracts and capabilities.

## Consequences

New projects receive a self-consistent note structure and a complete default skill set. Existing projects
retain user-edited paired files as conflicts when bilingual pairing is disabled. Rule-pack changes continue
to require manifest hash refresh and regression coverage for feature removal and conflict protection. The
English-only materialization drops links to paired files that the disabled feature intentionally omits, while
the bilingual source retains its bidirectional language switcher for pair verification.
