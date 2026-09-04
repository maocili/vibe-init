# Agent Note: dsh-rules implementation design

Status: implemented

## Problem

Implementation mechanics and design trade-offs were mixed into the public documentation set. That
made a mutable engineering description look like a stable contract and made future changes likely to
duplicate or contradict the requirements.

## Decision

The implementation is organized as a deterministic plan → evaluate → apply pipeline. `rules-pack/`
is the only versioned source for rule and skill content; `manifest.json` records feature defaults,
toolchain groups, file targets, and content hashes. The engine appends marker-wrapped rule blocks,
materializes fresh notes and selected skills, and manages the project toolchain while preserving
user-edited content as conflicts. Repeated runs converge without writes, and `status`/`audit` reuse
the same read-only plan.

The Cordis entry point only validates the pack and reports that the plugin is mounted. Explicit CLI
commands perform project-local writes. The project boundary is permanent: no command installs or
updates the user-global `~/.dsh/` plane.

The distributable form is the public npm package `@deepseek-ai/dsh-rules`. Its manifest declares
`dsh.bundle.patch` pointing to the package-local `cordis.patch.yml`; that patch inserts the same package
as the Cordis plugin when a DSH profile installs the bundle. The npm `files` allowlist carries only the
runtime, CLI, patch, and `rules-pack/`; an absolute `file://` entry remains a checkout-development
fallback.

The former design document is now a pointer; this note is the home for implementation decisions and
their rationale. Stable scope and behavior remain in
[`REQUIREMENTS`](../../../../docs/REQUIREMENTS-dsh-rules-plugin.md), and evidence remains in
[`ACCEPTANCE`](../../../../docs/ACCEPTANCE.md).

## Alternatives considered

**Keep mechanics in `docs/DESIGN`.** This gives maintainers a familiar reference but leaves design
facts beside normative requirements and encourages a second history of decisions.

**Fold every implementation detail into `REQUIREMENTS`.** This would make the contract harder to
review and would blur what users can rely on with how the plugin currently works.

**Use only commit messages.** Git history is useful for forensics but is not a discoverable,
cross-linked decision record and does not state rejected alternatives.

**Publish a plain plugin package without bundle metadata.** That would make the module installable but
would leave DSH profile management unable to discover its patch layer; the package therefore declares the
host's bundle contract and owns the minimal self-inserting patch.

**Keep the absolute file URL as the distribution path.** It works for a checkout but ties profile state to
one machine path and cannot be consumed from a package manager; it remains only as a local development
fallback.

## Consequences

Future architecture or implementation changes update this note (and its Chinese counterpart) in the
same change. Public docs link here instead of copying mechanics. Any change to the rules-pack
manifest, materialization semantics, conflict policy, or mount behavior must keep the implementation
tests and acceptance evidence aligned. The package manifest, bundle patch, tarball file list, and
package-consumer smoke test are the source of truth for the M3 distribution contract.
