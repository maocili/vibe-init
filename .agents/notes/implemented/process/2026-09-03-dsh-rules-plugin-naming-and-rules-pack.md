# Agent Note: dsh-rules plugin naming and rules-pack layout

Status: implemented

English | [中文](2026-09-03-dsh-rules-plugin-naming-and-rules-pack.zh.md)

## Problem

The dsh-rules plugin repository scaffolded on the design draft inherited draft-era naming: the DESIGN document and its command table used `discipline <action>` / `dsh-discipline`, and the rule-pack directory was `discipline-pack/`. The landed repository name (`dsh-rules`) disagreed with its own docs, entry `AGENTS.md` could only defer the settlement to DESIGN §10 open question 1, and the root-layout extension this repository adds to hold the rule pack and the plugin sources was not yet recorded in this repository's Agent Notes.

## Decision

- Plugin name and command prefix settle on **dsh-rules**: CLI actions run as `dsh-rules init|status|upgrade|audit|install-global|hash|list-skills`, managed segments use `<!-- dsh-rules:<entryId>:start/end -->` markers, and the Cordis insert id is `dsh-rules`. The draft names `dsh-discipline` / `discipline-*` are dropped; they survive only as naming history in the DESIGN doc.
- The rule-pack directory is renamed `discipline-pack/` → **`rules-pack/`** — still the single versioned content source at the repository root; the plugin default pack path, CLI help, manifest paths and entry docs follow the new name.
- The DESIGN file is renamed with the repository (`DESIGN-dsh-rules-plugin.md`, H1 updated), and DESIGN §10 open question 1 is recorded as settled (2026-09-03).
- The repository-root layout now holds entry `AGENTS.md`, `README.md`, `DESIGN-dsh-rules-plugin.md`, `rules-pack/`, `plugin/`, `.template/` and `.agents/` — an extension of the container's [agents-at-repo-root](2026-08-19-agents-at-repo-root.md) decision. In this repository `.agents/notes/` carries the project's own development records; the corpus that the `rules-pack/` placeholders are distilled from lives in the original `../vibe-coding-templates` repository.

## Alternatives considered

- **Keep the draft names** (rename the repository/plugin back to `dsh-discipline` / `discipline-pack`) — rejected: the repository name, package name and CLI entry were already `dsh-rules`, and the `dsh-*` skill naming style reads naturally with a `dsh-rules` prefix.
- **Update the docs only** (keep `discipline-pack/` on disk while writing `rules-pack/`) — rejected: the directory is the plugin's default pack path and the manifest's home; docs and the default must come from one source or the entry description drifts again.
- **Bare command names** (`init` / `status` with no prefix) — rejected: prefixless verbs are hard to attribute inside a session alongside other tooling; the `dsh-rules` prefix keeps the CLI, the markers and future in-session tools discoverably namespaced.

## Consequences

Entry docs, the DESIGN working draft, plugin code and the rule-pack directory now agree on one name and one pack location. All materializations so far happened only under the repository's own scratch scaffolding, so no external consumer needs migration; future `[实现期]` rule content is authored under `rules-pack/`.

