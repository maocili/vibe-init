# Agent Note: standalone vibe-init hard cut

Status: proposed

## Problem

The initializer is distributed as both a Cordis plugin and a CLI, so a project-local materializer also
owns DSH bundle metadata, a profile patch, plugin mounting behavior, and host-specific packaging tests.
Those host surfaces do not contribute to planning or applying project changes, but they enlarge the
published contract and couple releases to DSH profile and Cordis lifecycle semantics.

The existing names also make the project-local tool appear to be a DSH subsystem. Renaming only the
command would preserve aliases, environment variables, durable paths, markers, and migration behavior,
leaving two identities and a permanent compatibility matrix.

## Proposal

Publish the initializer only as the standalone npm CLI package `@maocili/vibe-init`, exposing the
`vibe-init` binary. Remove the DSH/Cordis plugin entry point, bundle patch and metadata, profile
installation behavior, and tests or documentation whose only purpose is those host capabilities. The
published package will not expose a Cordis plugin API or a DSH bundle contract.

Make the rename a complete hard cut. The new implementation will neither recognize nor provide aliases
for the old package, binary, or environment variables. It will create and manage only `.vibe-init/**`
and `vibe-init:*` marker blocks. It will not read, migrate, modify, or delete `.dsh-vibe/**` or
`dsh-vibe:*` marker blocks, even when both old and new assets exist in one project. There will be no
legacy discovery, migration command, compatibility warning, or cleanup path. Existing installations
remain untouched historical assets unless their owner handles them outside `vibe-init`.

### Naming matrix

| Surface | New contract | Old surface and hard-cut treatment |
| --- | --- | --- |
| npm package | `@maocili/vibe-init` | `@maocili/dsh-vibe` is not an alias or dependency. |
| executable | `vibe-init` | `dsh-vibe` is not shipped as a bin or shim. |
| pack override | `VIBE_INIT_PACK` | `DSH_VIBE_PACK` is ignored. |
| toolchain-install test override | `VIBE_INIT_SKIP_TOOLCHAIN_INSTALL` | `DSH_VIBE_SKIP_TOOLCHAIN_INSTALL` is ignored. |
| managed home | `.vibe-init/` | `.dsh-vibe/` is never read, migrated, or removed. |
| durable state | `.vibe-init/state.json` with `schemaVersion: 2` | Old state is not accepted as input to schema version 2. |
| managed toolchain | `.vibe-init/toolchain/` | `.dsh-vibe/toolchain/` is not detected or cleaned up. |
| marker namespace | `<!-- vibe-init:<id>:start -->` / `<!-- vibe-init:<id>:end -->` | `dsh-vibe:*` markers are ordinary pre-existing text and remain untouched. |
| diagnostic prefix | `[vibe-init]` | `[dsh-vibe]` is not retained for compatibility. |

### Retained design

The deterministic `plan` → `evaluate` → `apply` separation remains the implementation boundary. A dry
run and every read-only report will evaluate the same plan used by writes. `packages/` remains the sole
versioned source for rules, note skeletons, skills, features, and toolchain content; runtime code will
not duplicate that content.

Conflict protection also remains. Initialization will not overwrite foreign content, and updates will
use the new state records and content hashes to distinguish tool-owned content from user edits.
Malformed or duplicate new marker blocks and modified managed files will block their affected writes
rather than being overwritten. These protections apply only to the new namespace and do not inspect old
assets.

`.vibe-init/state.json` starts at `schemaVersion: 2`; version 1 is deliberately not a readable
predecessor. State records the effective pack version and features plus ownership and source/installed
hashes needed by the new namespace. A state update is written through a temporary file and atomic rename
only after planned file operations and any required toolchain dependency installation succeed. Failure
leaves the prior version 2 state intact.

### Lost capabilities

Users lose DSH profile installation and removal, bundle-driven discovery, Cordis mounting and mounted
status, and any host-managed distribution or update path. Existing `@maocili/dsh-vibe` invocations,
`dsh-vibe` scripts, DSH-prefixed environment configuration, `.dsh-vibe` state and toolchain ownership,
and `dsh-vibe:*` managed segments receive no upgrade or cleanup assistance. A project may consequently
contain old and new generated material until its owner removes or reconciles the old material manually.

### Supersession and reintroduction

If implemented, this proposal will partially supersede the host-distribution subdecision in the current
[dsh-vibe implementation design](../../implemented/architecture/2026-09-04-dsh-vibe-implementation-design.md):
the Cordis entry point, package name, bundle patch, and profile insertion described there will cease to
be current. That note will continue to own the retained pipeline, `packages/` ownership, project-only
boundary, materialization semantics, and conflict policy until implementation moves this proposal and
updates the surviving owner. This is partial, not full, supersession.

Host integration may be proposed again only with evidence that users require a DSH-only lifecycle or
distribution operation that a standalone npm CLI cannot provide, plus a named owner for host API
compatibility, release coupling, installation failure, and removal semantics. Reintroducing old-name or
old-state compatibility separately requires a concrete installed-base need, an explicit migration and
retirement policy, and tests proving that legacy assets cannot be mistaken for new ownership. Neither
capability may return as an undocumented alias or incidental adapter.

## Alternatives considered

**Keep the plugin and add `vibe-init` as another binary.** This preserves host convenience, but it keeps
the bundle, profile, Cordis lifecycle, dual entry points, and their release coupling. It adds a name
without simplifying ownership.

**Rename while migrating existing installations.** Reading version 1 state, translating markers, and
moving `.dsh-vibe` would reduce manual cleanup, but it would make legacy ownership and partial-failure
recovery part of the new product. The compatibility implementation would outlive the rename and weaken
the hard boundary.

**Recognize old assets read-only and print guidance.** Detection appears cheaper than migration, but it
still makes old paths, markers, and malformed legacy data inputs to every future audit. It also creates
an implied duty to keep detection accurate. The standalone tool therefore remains unaware of them.

**Keep DSH distribution in a separate adapter package now.** An adapter would isolate some host code,
but without demonstrated demand it preserves the same capability and release obligations in another
package. The reintroduction conditions define when such an adapter becomes justified.

**Continue publishing `@maocili/dsh-vibe` as a deprecation wrapper.** A wrapper would help command
discovery but retains the old package and binary as supported surfaces and obscures which implementation
owns project state. Release notes outside the runtime are sufficient for announcing the hard cut.

## Acceptance criteria

- The published package is named `@maocili/vibe-init`, ships only the `vibe-init` binary as its public
  runtime entry, and contains no Cordis plugin entry, DSH bundle metadata or patch, or profile mutation
  capability.
- Runtime naming matches the matrix. Tests prove old package/bin aliases and DSH-prefixed environment
  variables are unsupported and that only `.vibe-init/**`, `vibe-init:*`, and `[vibe-init]` are used by
  the new implementation.
- Fresh initialization writes `.vibe-init/state.json` with `schemaVersion: 2`. Missing, malformed, or
  unsupported new state fails without adopting version 1 or any `.dsh-vibe/state.json` data.
- Fixtures containing `.dsh-vibe/**` and `dsh-vibe:*` markers are byte-for-byte unchanged after init,
  status/audit-style reads, upgrade, failures, and forced operations; no code path enumerates them for
  migration or cleanup.
- Plan, evaluate, and apply remain separately testable; dry runs and read-only reports share the write
  plan; all materialized content resolves from `packages/`.
- Conflict tests cover foreign files, user-modified managed files, and malformed or duplicate new
  markers. A conflict blocks only its affected write and is never bypassed by treating an old asset as
  evidence of ownership.
- State is committed by atomic replacement only after file application and required dependency
  installation succeed; failure tests preserve the previous valid schema version 2 state.
- User documentation and package tests state the lost capabilities and contain no supported workflow
  through a DSH plugin, bundle, or profile.

## Risks

A hard cut places cleanup and reconciliation costs on existing users and can leave duplicated generated
rules or toolchains in a project. Ignoring old markers prevents accidental takeover but also prevents the
new CLI from detecting contradictory old content. Removing host distribution may reduce discoverability
and eliminate profile-level automation. Renaming environment variables can silently change custom pack
or test behavior when callers fail to update their configuration. Schema version 2 has no recovery path
from version 1, so ownership history begins fresh and conservative conflicts may require manual review.
