# vibe-init toolchain

This directory is the project-local managed toolchain materialized by `vibe-init`. It contains the configured documentation gates and their supporting files under `.vibe-init/toolchain/`.

## Requirements

- Node.js 20 or newer and pnpm.
- A project initialized by `vibe-init`, including `.agents/notes/`.
- Commands run from the project root; documentation gates scan that root and its `README.md`, `AGENTS.md`, `docs/`, and `.agents/` content.

## Usage

```sh
pnpm -C .vibe-init/toolchain install --ignore-scripts
pnpm -C .vibe-init/toolchain run doc-sync
```

`doc-sync` runs the enabled gate scripts in the order declared by the materialized `package.json`. Enable optional groups during initialization or upgrade:

```sh
vibe-init init --feature bilingualDocsDiscipline=true
vibe-init init --feature docGatesExtras=true
vibe-init init --feature docGates=false
```

The bilingual group keeps its prompt corpus and pairing manifest in the toolchain home while project documents remain rooted at the project directory. The extras group adds stricter Markdown, Mermaid, and skill-metadata checks. Disabling `docGates` removes the managed toolchain.

## Git hooks

The postinstall script writes a marker-owned root `lefthook.yml` and installs hooks into a worktree-local directory under the absolute Git directory. Pre-commit checks staged whitespace and the applicable Agent Note archive or bilingual pairing records; pre-merge repeats the integrity checks; pre-push runs `doc-sync`. Other source, build, and behavior evidence remains selected by the project's `pre-push-checks` skill, while CI owns exhaustive and platform-matrix coverage when available.

The installer never replaces a foreign `lefthook.yml`, an unowned hook directory, or a custom worktree hook path. An inherited system, global, or repository hook path can be shadowed for the current worktree only by setting `VIBE_INIT_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE=1`. Installation may enable Git's `extensions.worktreeConfig`; disabling `docGates` does not remove the resulting Git configuration or hooks automatically.
