# vibe-init

English | [中文](README.zh.md)

vibe-init is a **standalone CLI initializer** for project-local rules and documentation. It installs a versioned rule pack without touching the user's global configuration or skill directories.

It manages marker-wrapped rule segments in the project's root `AGENTS.md`, the `.agents/notes/` skeleton documentation, declared `.agents/skills/` skill copies, generated `docs/AGENTS.md`, and the `.vibe-init/toolchain/` documentation quality-gate toolchain. The sole source of truth for rule text is [`packages/`](packages/README.md); CLI code only plans, compares, and materializes content.

## Quick start

Install the standalone CLI globally from the versioned Git repository:

```bash
pnpm install --global github:maocili/vibe-init#v0.3.0
```

In the target project, preview the changes first, then explicitly apply them:

```bash
vibe-init init --dry-run
vibe-init init --yes
```

Afterward, you can use:

```bash
# 检查受管内容、规则包摘要与受管面内意外内容（只读；不探测旧命名空间）
vibe-init audit

# 将规则包的新版内容迁移到项目（先加 --dry-run 更稳妥）
vibe-init upgrade --yes
```

The default entry point is the Git project containing the current directory. You can also specify `--project <dir>`. In non-interactive environments, write commands must include `--yes` or `--dry-run`.

## Default installed content

| Location | Content |
|---|---|
| `<project>/AGENTS.md` | Three managed rule segments for Agent Notes, text links, and documentation budgets |
| `<project>/.agents/notes/` | Bilingual-ready notes skeleton and four-quadrant lifecycle directories |
| `<project>/.agents/skills/` | All project-level skill copies shipped with the package |
| `<project>/.vibe-init/toolchain/` | Default docGates scripts, configuration, and deterministically assembled `package.json` |

`textLinkManagement`, `bilingualPairing`, `docBudgets`, and `docGates` are enabled by default; `bilingualDocsDiscipline` and `docGatesExtras` are disabled by default. For example:

```bash
# 为本次迁移启用双语纪律及其门禁
vibe-init upgrade \
  --feature bilingualDocsDiscipline=true --yes

# 移除由初始化器管理的 docGates 工具链
vibe-init upgrade \
  --feature docGates=false --yes
```

When a feature is disabled or removed from the manifest, the initializer deletes only managed copies confirmed by `state.json` whose contents still match the last installed hash. Files edited by the user, files added by the user, and files whose ownership cannot be determined are reported as conflicts and retained. Upgrades do not modify date-named Agent Notes, the notes `manifest.json`, or business `docs/**`.

Each project stores the pack version, feature configuration, markers, and source/installed hashes for managed files in `.vibe-init/state.json`. `upgrade` always shows a categorized dry-run first; non-interactive writes require `--yes`. When the toolchain package or dependency set changes, a successful file migration is followed by `pnpm -C .vibe-init/toolchain install`; the new state is committed only after both files and dependencies succeed. The old `.dsh-vibe/` namespace is not discovered or migrated.

## Commands

| Command | Purpose |
|---|---|
| `init` | Create the managed surface for a project |
| `upgrade` | Migrate to the current rule-pack version with the same idempotent engine |
| `status` | Show itemized status without writing to disk |
| `audit` | Run `status` plus rule-pack integrity and unexpected-content checks without writing to disk (the old `.dsh-vibe/` namespace is never inspected) |
| `hash --pack packages` | Refresh manifest sha256 values for rule lines and skill assets after modifying the rule pack |
| `list-skills` | List the project skills installed by default |

`init` and `upgrade` copy every skill declared by the manifest into the project's `.agents/skills/` by default; `--skill <name>` remains for compatibility with older invocations. `init` reports edited user skills as conflicts; `upgrade` overwrites files declared by the rule pack while retaining user-added files in skill directories.

## Development and docs

```bash
pnpm test
```

`pnpm test` runs the repository's Node test suite. `pnpm run package:check` validates tests and pack contents; `pnpm run package:build` writes a release tarball under `artifacts/`. After modifying `packages/`, refresh its manifest summary:

```bash
node bin/vibe-init.mjs hash --pack packages
```

Detailed material is in [`docs/`](docs/README.md):

- [Requirements and scope](docs/REQUIREMENTS-vibe-init.md) is the settled contract;
- [Documentation standard](docs/AGENTS.md) defines tiers, editorial targets, and budget gates;
- [Acceptance matrix](docs/ACCEPTANCE.md) maps requirements to implementation and tests;
- [Implementation design Agent Note](.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md) records implementation tradeoffs;
- [Implementation history Agent Note](.agents/notes/implemented/process/2026-09-04-vibe-init-implementation-history.md) records milestones;
- [Upgrade ownership migration Agent Note](.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) records state and overwrite boundaries;
- [Standalone hard-cut Agent Note](.agents/notes/implemented/simplification/2026-09-06-standalone-vibe-init.md) records the removal rationale and compatibility boundary.
