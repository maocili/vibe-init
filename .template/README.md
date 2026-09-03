# vibe-coding-templates

English | [中文](README.zh.md)

A lean template repository for vibe coding, distilled from the [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) project: it keeps the working discipline and drops the product history. Use it as the starting skeleton for a new project — copy the tree, `git init`, `pnpm install`, and start writing.

## Layout

- `AGENTS.md` — standing orders; the entry point for any agent session.
- `docs/` — the documentation standard (`AGENTS.md`), the bilingual pairing contract (`i18n/`), and postmortem rules (`postmortem/`).
- `.agents/notes/` — Agent Notes: durable decision records with lifecycle and classification rules.
- `.agents/skills/` — reusable skill examples; write your own per their format.
- `scripts/` — the doc and note gates behind `pnpm run doc-sync`.

## Getting started

1. Copy this template (`AGENTS.md`, `docs/`, `scripts/`, …) together with the sibling `.agents/` corpus into your new project directory.
2. Run `git init` and `pnpm install`.
3. Run `pnpm run doc-sync` once to verify the baseline is green.
4. Replace this README's content with your project's introduction, keeping the bilingual pair.

## Gates

- `pnpm run doc-sync` — links, wrapping, budgets, note format, archived-note integrity, pairing, skill metadata, `ts` fences.
- `pnpm test` — vitest specs for the gates.
- `pnpm run verify-translation-pairing --write <pair>` — re-record a bilingual pair after editing either side.

Rules and rationale live in the linked documents; keep each fact in its home.
