# dsh-rules

English | [中文](README.zh.md)

dsh-rules is a **per-project initializer**. It installs a versioned rule pack into a project without touching the user's global configuration or skill directories.

It manages marker-wrapped rule segments in the project's root `AGENTS.md`, the `.agents/notes/` skeleton documentation, declared `.agents/skills/` skill copies, generated `docs/AGENTS.md`, and the `.dsh-rules/toolchain/` documentation quality-gate toolchain. The sole source of truth for rule text is [`rules-pack/`](rules-pack/README.md); plugin code only plans, compares, and materializes content.

## Quick start

In the target project, preview the changes first, then explicitly apply them:

```bash
pnpm dlx @xuxf/dsh-rules init --dry-run
pnpm dlx @xuxf/dsh-rules init --yes
```

To install the package as a project dependency instead of using `pnpm dlx`:

```bash
pnpm add @xuxf/dsh-rules
pnpm exec dsh-rules init --dry-run
pnpm exec dsh-rules init --yes
```

`pnpm add` records the package in `package.json`; `pnpm install` installs packages already declared there. `pnpm dlx` runs the published CLI without adding a project dependency.

Afterward, you can use:

```bash
# 检查受管内容、规则包摘要与旧容器残留（只读）
pnpm dlx @xuxf/dsh-rules audit

# 将规则包的新版内容迁移到项目（先加 --dry-run 更稳妥）
pnpm dlx @xuxf/dsh-rules upgrade --yes
```

The default entry point is the Git project containing the current directory. You can also specify `--project <dir>`. In non-interactive environments, write commands must include `--yes` or `--dry-run`.

## Default installed content

| Location | Content |
|---|---|
| `<project>/AGENTS.md` | Three managed rule segments for Agent Notes, text links, and documentation budgets |
| `<project>/.agents/notes/` | Bilingual-ready notes skeleton and four-quadrant lifecycle directories |
| `<project>/.agents/skills/` | All project-level skill copies shipped with the package |
| `<project>/.dsh-rules/toolchain/` | Default docGates scripts, configuration, and deterministically assembled `package.json` |

`textLinkManagement`, `bilingualPairing`, `docBudgets`, and `docGates` are enabled by default; `bilingualDocsDiscipline` and `docGatesExtras` are disabled by default. For example:

```bash
# 为本次迁移启用双语纪律及其门禁
pnpm dlx @xuxf/dsh-rules upgrade \
  --feature bilingualDocsDiscipline=true --yes

# 移除由插件管理的 docGates 工具链
pnpm dlx @xuxf/dsh-rules upgrade \
  --feature docGates=false --yes
```

When a feature is disabled or removed from the manifest, the plugin deletes only managed copies confirmed by `state.json` whose contents still match the last installed hash. Files edited by the user, files added by the user, and legacy files whose ownership cannot be determined are reported as conflicts and retained. Upgrades do not modify date-named Agent Notes, the notes `manifest.json`, or business `docs/**`.

Each project stores the pack version, feature configuration, markers, and source/installed hashes for managed files in `.dsh-rules/state.json`. `upgrade` always shows a categorized dry-run first; non-interactive writes require `--yes`. When the toolchain package or dependency set changes, a successful file migration is followed by `pnpm -C .dsh-rules/toolchain install`; the new state is committed only after both files and dependencies succeed.

## Commands

| Command | Purpose |
|---|---|
| `init` | Create the managed surface for a project |
| `upgrade` | Migrate to the current rule-pack version with the same idempotent engine |
| `status` | Show itemized status without writing to disk |
| `audit` | Run `status` plus rule-pack integrity and legacy-residue checks without writing to disk |
| `hash --pack rules-pack` | Refresh manifest sha256 values for rule lines and skill assets after modifying the rule pack |
| `list-skills` | List the project skills installed by default |

`init` and `upgrade` copy every skill declared by the manifest into the project's `.agents/skills/` by default; `--skill <name>` remains for compatibility with older invocations. `init` reports edited user skills as conflicts; `upgrade` overwrites files declared by the rule pack while retaining user-added files in skill directories.

## Install into a DSH profile

The public package is published as a DSH bundle. After it is installed in a profile, the host adds the plugin layer automatically from the package's `dsh.bundle.patch` declaration:

```bash
dsh plugin --profile web add @xuxf/dsh-rules
```

After restarting the profile, `[dsh-rules] mounted` in the log indicates a successful load. Mounting itself has no disk-writing side effect; you still need to run the CLI commands above to initialize a project.

## Develop with a local checkout

For local development or when the host package is not installed, merge the entry from [`cordis.patch.sample.yml`](cordis.patch.sample.yml) into your local profile:

```yaml
- insert:
    - id: dsh-rules
      name: file:////Users/xuxifeng/Work/dsh-rules/dsh-rules.mjs
```

This is a checkout-only fallback path, not the installation method for the published package.

## Development and docs

```bash
pnpm test
```

`pnpm test` runs 48 Node tests. After modifying `rules-pack/`, refresh its manifest summary:

```bash
node bin/dsh-rules.mjs hash --pack rules-pack
```

Detailed material is in [`docs/`](docs/README.md):

- [Requirements and scope](docs/REQUIREMENTS-dsh-rules-plugin.md) is the settled contract;
- [Documentation standard](docs/AGENTS.md) defines tiers, editorial targets, and budget gates;
- [Acceptance matrix](docs/ACCEPTANCE.md) maps requirements to implementation and tests;
- [Implementation design Agent Note](.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md) records implementation tradeoffs;
- [Implementation history Agent Note](.agents/notes/implemented/process/2026-09-04-dsh-rules-implementation-history.md) records milestones;
- [Upgrade ownership migration Agent Note](.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) records state and overwrite boundaries.
