# Agent Note: Archived kind placeholders and fresh-checkout baseline tolerance

Status: implemented

English | [中文](2026-08-14-archived-kind-placeholders-and-fresh-baseline.zh.md)

## Problem

Git does not track empty directories, and [verify-archived-agent-notes](../../../../.template/scripts/verify-archived-agent-notes.ts) requires all six kind directories (`feature/`, `bug-fix/`, `simplification/`, `architecture/`, `process/`, `testing/`) to exist under [archived/](../../archived/AGENTS.md). A fresh clone of this template therefore failed the gate with "required kind directory is missing" for every kind. The same gate also read its sealed-manifest baseline from Git `HEAD`, so a checkout with no commits yet — or no Git repository at all — failed with the cryptic `fatal: Not a valid object name HEAD^{commit}` / `not a git repository`, even though there was nothing sealed to compare.

## Decision

- Ship a `.gitkeep` placeholder file in each archived kind directory so the empty tree survives clones and copies, and teach the verifier to skip files named `.gitkeep` when enumerating kind-directory artifacts.
- When the baseline ref is the default `HEAD` and Git cannot produce it (no commits, or not a Git repository), treat the baseline as empty (`{version: 1, files: {}}`) instead of failing: with nothing sealed in Git, the empty sealed set is exactly right, and the template's own getting-started flow runs `doc-sync` before the first commit. An explicitly set `DSH_ARCHIVE_BASE_REF` keeps failing loud, because that is a CI contract rather than a fresh-checkout state.

## Alternatives considered

- **Creating the kind directories by hand after a clone** — rejected: the failure only surfaces when the gate runs, and a template should pass its own gates in the state it ships.
- **A `README.md` placeholder per kind directory** — rejected: the Markdown gates would scan it, and [archived/AGENTS.md](../../archived/AGENTS.md) already states everything the archive needs; `.gitkeep` is the conventional empty-directory placeholder.
- **Requiring the first commit before `doc-sync`** — rejected: with zero sealed artifacts an empty baseline is correct, and ordering the flow around the gate would hide a real fresh-clone failure behind a misleading one.

## Consequences

- A fresh clone passes `verify-archived-agent-notes` with zero frozen artifacts across the six kinds, and the first archived triplet is sealed with `--write` as before.
- The sealed-manifest extension check still protects every sealed artifact whenever a baseline exists; only the unavailability of the default `HEAD` baseline is tolerated.
- The two behavior extensions are confined to small, named branches in the verifier (the `.gitkeep` skip and the default-baseline fallback) and are documented here.
