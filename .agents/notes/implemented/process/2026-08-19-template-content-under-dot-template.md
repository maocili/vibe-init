# Agent Note: Template content under .template/ with a root entry point

Status: implemented

English | [中文](2026-08-19-template-content-under-dot-template.zh.md)

## Problem

The repository root mixed two concerns: it was both the Git repository root and the template content root. Every file of the vibe-coding template — standing orders, docs, notes, skills, scripts, and project configuration — sat directly at the top level, so the root could not host anything else (a second template, container-level documentation, or unrelated content) without entangling it with the template's gates. The template's own scripts resolve the repository root as `resolve(import.meta.dirname, '..')`, which tied the tree to a fixed layout and made a move appear costly. At the same time, `verify-archived-agent-notes` read its sealed-manifest baseline path from a hard-coded repository-relative string, which silently breaks when tracked content lives in a subdirectory of the Git root.

## Decision

- Move the template content into a `.template/` subdirectory of the repository: `AGENTS.md`, the bilingual `README` triplet, `docs/`, `scripts/`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, and `tsconfig.host.json`. The `.agents/` corpus is a container-level sibling at the repository root rather than part of `.template/` ([agents-at-repo-root note](2026-08-19-agents-at-repo-root.md)).
- Keep the Git root at the parent: `.git/`, `.gitattributes`, and `.gitignore` stay at the repository root, so the repository remains a container that can host the template, the `.agents/` corpus, and anything else. The template stays self-contained inside `.template/` apart from that sibling corpus: its scripts resolve the root via `import.meta.dirname`, its gates run with `pnpm` inside the directory, its pairing records are content-hash based and unaffected by the move, and gates locate `.agents/` by walking up from the script directory.
- Add a root-level `AGENTS.md` entry point that names the layout and tells sessions to open inside `.template/` to load the full rules. Root-level files are container-level only and are outside the template's gate scope.
- Make `scripts/verify-archived-agent-notes.ts` derive the sealed-manifest path from the Git root (`git rev-parse --show-toplevel`) instead of a hard-coded `.agents/notes/archived/manifest.json`, so the baseline comparison works whether content sits at the Git root or in a subdirectory.

## Alternatives considered

- **Moving `.git` into the subdirectory (content and repository root coincide)** — rejected: the repository is a container for templates, and relocating the Git root would leave the parent without version control and force every future sibling to carry its own repository.
- **Keeping the template at the root and only adding a container README** — rejected: it does not separate concerns; root files would remain entangled with the template's gates, and the user asked for the files to be grouped under one folder.
- **A non-hidden folder name (`template/`)** — rejected in favor of the user's choice `.template/`; the hidden dot-directory keeps the container root clean while the gates and the DSH file globs match explicit dot-prefixed paths, verified in practice.
- **Leaving `verify-archived-agent-notes` hard-coded and documenting the assumption** — rejected: the gate would fail or silently compare against the wrong path the next time content lives below the Git root; deriving from `git rev-parse --show-toplevel` costs one subprocess and stays correct under either layout.

## Consequences

- The repository root now holds the Git metadata, the entry `AGENTS.md`, the `.agents/` corpus, and `.template/`; `.pnpm-store/` remains at the root as a shared pnpm store cache and stays ignored.
- Sessions must open inside `.template/` to load the full template rules as a baseline; a session at the root loads only the entry document. Nested instruction discovery still injects `.template/AGENTS.md` when a session touches files under it.
- `pnpm run doc-sync`, `pnpm test`, and `pnpm build` now run inside `.template/`; all gates pass unchanged because content hashes and repository-relative paths inside the template are preserved by `git mv`.
- Git history is preserved as renames, and pairing records require no re-recording because blob hashes are content-based.
- Future sibling content can sit beside `.template/` at the root without touching the template's gates.
