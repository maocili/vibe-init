# Agent Note: active Agent Note triplet gate

Status: implemented

## Problem

The documentation aggregate validated active Agent Note structure and archived Note triplets, but it did
not require an active Note to have both language files and a current consistency sidecar. A lone English
or Chinese Note, or a stale sidecar, could therefore pass `doc-sync` and remain noncompliant until an
archive operation exposed the incomplete triplet.

## Decision

The default Agent Note format gate also validates active bilingual triplets whenever project state and
the managed Note README declare bilingual pairing. Every Note under `proposed/`,
`implemented/`, and `rejected/` must have sibling `.md`, `.zh.md`, and `.i18n.yaml` files. The sidecar
must name exactly both language files and record their current Git blob hashes. Localized files and
sidecars without an English source are rejected as orphans.

The check remains in the base `docGates` group because Agent Note pairing is controlled by the separate,
default-on `bilingualPairing` feature. It does not depend on the optional repository-wide
`bilingualDocsDiscipline` gate. A corpus without the root pairing sidecar retains the supported
English-only behavior.

## Alternatives considered

**Include active Notes in the repository-wide translation pairing gate.** That gate is optional and
uses a broader document contract, so tying Note correctness to it would leave the default configuration
unprotected and conflate two independent features.

**Check completeness only while archiving.** This preserves the existing implementation but allows an
invalid active record to survive every routine documentation check, which is the gap being closed.

**Require triplets unconditionally.** Projects can explicitly disable `bilingualPairing`; requiring
counterparts there would contradict the supported English-only Note corpus.

## Consequences

`doc-sync` now fails as soon as an active bilingual Note is incomplete, orphaned, or changed without
refreshing its sidecar. The gate uses only built-in Node.js APIs and stays available in the default
toolchain. Regression coverage exercises missing siblings, a valid triplet, and a stale recorded hash.
