# Agent Note: standalone vibe-init hard cut

Status: implemented

## Problem

The initializer had been distributed as both a Cordis plugin and a CLI, so a project-local materializer also owned DSH bundle metadata, a profile patch, plugin mounting behavior, and host-specific packaging tests. Those host surfaces did not contribute to planning or applying project changes, but enlarged the published contract and coupled releases to DSH profile and Cordis lifecycle semantics.

The old names also made the project-local tool appear to be a DSH subsystem. Renaming only the command would preserve aliases, environment variables, durable paths, markers, and migration behavior, leaving two identities and a permanent compatibility matrix.

## Decision

The initializer is published only as the standalone npm CLI package `@maocili/vibe-init`, exposing the `vibe-init` binary. The DSH/Cordis plugin entry point, bundle patch and metadata, profile installation behavior, and host-only tests and documentation are removed. The published package exposes no Cordis plugin API or DSH bundle contract.

The rename is a complete hard cut. The implementation neither recognizes nor provides aliases for the old package, binary, or environment variables. It creates and manages only `.vibe-init/**` and `vibe-init:*` marker blocks. It does not read, migrate, modify, or delete `.dsh-vibe/**` or `dsh-vibe:*` marker blocks, even when both old and new assets exist in one project. There is no legacy discovery, migration command, compatibility warning, or cleanup path. Existing installations remain historical assets unless their owner handles them outside `vibe-init`.

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

The deterministic `plan` → `evaluate` → `apply` separation remains the implementation boundary. A dry run and every read-only report evaluate the same plan used by writes. `packages/` remains the sole versioned source for rules, note skeletons, skills, features, and toolchain content; runtime code does not duplicate that content. The materialized toolchain's bilingual prompt corpus and pairing manifest are toolchain-owned and resolve from `.vibe-init/toolchain/`; project documents continue to resolve from the project root.

Conflict protection also remains. Initialization does not overwrite foreign content, and updates use new state records and content hashes to distinguish tool-owned content from user edits. Malformed or duplicate new marker blocks and modified managed files block their affected writes rather than being overwritten. These protections apply only to the new namespace and do not inspect old assets.

`.vibe-init/state.json` starts at `schemaVersion: 2`; version 1 is deliberately not a readable predecessor. State records the effective pack version and features plus ownership and source/installed hashes needed by the new namespace. A state update is written through a temporary file and atomic rename only after planned file operations and any required toolchain dependency installation succeed. Failure leaves the prior version 2 state intact.

### Lost capabilities

Users lose DSH profile installation and removal, bundle-driven discovery, Cordis mounting and mounted status, and any host-managed distribution or update path. Existing `@maocili/dsh-vibe` invocations, `dsh-vibe` scripts, DSH-prefixed environment configuration, `.dsh-vibe` state and toolchain ownership, and `dsh-vibe:*` managed segments receive no upgrade or cleanup assistance. A project may consequently contain old and new generated material until its owner removes or reconciles the old material manually.

### Supersession and reintroduction

This decision partially supersedes the host-distribution subdecision in the [vibe-init implementation design](../architecture/2026-09-04-vibe-init-implementation-design.md): its historical Cordis entry point, package name, bundle patch, and profile insertion are no longer current. The design Note continues to own the retained pipeline, `packages/` ownership, project-only boundary, materialization semantics, and conflict policy. This is partial, not full, supersession.

Host integration may be proposed again only with evidence that users require a DSH-only lifecycle or distribution operation that a standalone npm CLI cannot provide, plus a named owner for host API compatibility, release coupling, installation failure, and removal semantics. Reintroducing old-name or old-state compatibility separately requires a concrete installed-base need, an explicit migration and retirement policy, and tests proving that legacy assets cannot be mistaken for new ownership. Neither capability may return as an undocumented alias or incidental adapter.

## Alternatives considered

**Keep the plugin and add `vibe-init` as another binary.** This preserves host convenience, but keeps the bundle, profile, Cordis lifecycle, dual entry points, and release coupling. It adds a name without simplifying ownership.

**Rename while migrating existing installations.** Reading version 1 state, translating markers, and moving `.dsh-vibe` would reduce manual cleanup, but would make legacy ownership and partial-failure recovery part of the new product. The compatibility implementation would outlive the rename and weaken the hard boundary.

**Recognize old assets read-only and print guidance.** Detection appears cheaper than migration, but still makes old paths, markers, and malformed legacy data inputs to every future audit. It also creates an implied duty to keep detection accurate. The standalone tool therefore remains unaware of them.

**Keep DSH distribution in a separate adapter package now.** An adapter would isolate some host code, but without demonstrated demand it preserves the same capability and release obligations in another package. The reintroduction conditions define when such an adapter becomes justified.

**Continue publishing `@maocili/dsh-vibe` as a deprecation wrapper.** A wrapper would help command discovery but retain the old package and binary as supported surfaces and obscure which implementation owns project state. Release notes outside the runtime are sufficient for announcing the hard cut.

## Consequences

The hard cut places cleanup and reconciliation costs on existing users and can leave duplicated generated rules or toolchains in a project. Ignoring old markers prevents accidental takeover but also prevents the new CLI from detecting contradictory old content. Removing host distribution may reduce discoverability and eliminate profile-level automation. Renaming environment variables can silently change custom pack or test behavior when callers fail to update their configuration. Schema version 2 has no recovery path from version 1, so ownership history begins fresh and conservative conflicts may require manual review.

Verification covers the package name and binary, absence of host surfaces, namespace and environment hard cut, schema 2 state, byte-preservation of old assets, shared planning, conflict protection, atomic state commit, and documentation of lost capabilities. The decision is partially superseded by future changes only through an updated design Note and explicit cross-links; it is not a license to reintroduce compatibility aliases.
