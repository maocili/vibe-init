# AGENTS.md — vibe-init repository

vibe-init is a standalone Node.js CLI that materializes project-local rules, Agent Note scaffolding, skills, and documentation tooling from the versioned `packages/` rule pack. It never writes user-global configuration or skill directories.

## Contracts and red lines

- [`docs/REQUIREMENTS-vibe-init.md`](docs/REQUIREMENTS-vibe-init.md) owns product scope; the [implementation design Agent Note](.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md) owns implementation rationale.
- Rule and skill content belongs in `packages/`; `bin/`, `lib/`, and `test/` contain installation and management behavior only.
- After changing `packages/`, refresh `packages/manifest.json` with `node bin/vibe-init.mjs hash --pack packages`. Keep `packages/toolchain/spec.json` aligned with toolchain group or dependency changes.
- Preserve the product boundary: no user-global writes and no discovery, migration, modification, or deletion of the retired `.dsh-vibe/` namespace.

## Verification

```bash
pnpm test
pnpm run package:check
```

## Navigation

- [`README.md`](README.md) — CLI installation, commands, and materialization semantics.
- [`docs/README.md`](docs/README.md) — documentation index.
- [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md) — requirement-to-evidence matrix.
- [`packages/README.md`](packages/README.md) — rule-pack contents and target mappings.

<!-- vibe-init:project-standing-orders-block:start -->
## Agent Notes

Changes to behavior, architecture, shared contracts, process or tooling, test strategy, or persistent formats require an Agent Note; follow the [Agent Note rules](.agents/notes/README.md) and use the `archive-agent-notes` skill when writing or changing one.
<!-- vibe-init:project-standing-orders-block:end -->

<!-- vibe-init:feature-text-link-management:start -->
## Text links

Keep cross-references between documentation, rules, and notes as valid relative Markdown links; see the [documentation standard](docs/AGENTS.md) and verify them with `pnpm -C .vibe-init/toolchain run doc-sync`.
<!-- vibe-init:feature-text-link-management:end -->

<!-- vibe-init:feature-doc-budgets:start -->
## Documentation

Give each documentation fact one owning page and keep standing documents within their configured budgets; follow the [documentation standard](docs/AGENTS.md) and verify the limits with `pnpm -C .vibe-init/toolchain run verify-doc-budgets --list`.
<!-- vibe-init:feature-doc-budgets:end -->
