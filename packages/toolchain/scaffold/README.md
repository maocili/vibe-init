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
