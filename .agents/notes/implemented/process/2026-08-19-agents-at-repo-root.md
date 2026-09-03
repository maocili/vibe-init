# Agent Note: Agent corpus at the repository root

Status: implemented

English | [中文](2026-08-19-agents-at-repo-root.zh.md)

## Problem

The template-content move into `.template/` also carried the `.agents/` corpus — Agent Notes and skills — inside the copyable template. The corpus is this container's own working inventory: sessions here write and maintain Agent Notes and skills, while `.template/` is the artifact users copy into new projects. Burying the corpus inside `.template/` entangled the container's working assets with the template, forced every gate to resolve `.agents/` relative to the template root, and made a copied project silently inherit the container's decision records. The container entry `AGENTS.md` also named only itself and the Git metadata as root-level content, contradicting the corpus's actual home.

## Decision

- Move `.agents/` from `.template/.agents` to the repository root, as a sibling of `.template/`. The corpus is container-level: Agent Notes record decisions about this container and its templates, and the skills model workflows agents use here.
- The template's gates locate the corpus by walking up from the script directory until `.agents/` exists ([repo-files.ts](../../../../.template/scripts/repo-files.ts)), so the same scripts work with the corpus at the repository root (this container) and at the project root (a copied template that includes the sibling corpus).
- Relative Markdown links cross the two siblings: template docs reference `../.agents/` targets and corpus files reference `../.template/` targets, and `verify-md-links` checks both trees.
- Starting a new project copies `.template/` and `.agents/` together, so the copied project keeps its agent corpus and the gates still find it.

## Alternatives considered

- **Leaving the corpus inside `.template/`** — rejected: the container's own notes and skills would ship inside every copied template, and the container entry `AGENTS.md` would keep mis-describing the root layout.
- **Splitting the corpus (notes in `.template/`, skills at the root)** — rejected: notes and skills cross-link and share one lifecycle; splitting would break the tree walk and force two gate roots.

## Consequences

- The repository root now holds the Git metadata, the entry `AGENTS.md`, the `.agents/` corpus, and `.template/`.
- The template's gates scan both trees; every relative link resolves across the siblings, so `doc-sync` stays green.
- The [template-content-under-dot-template note](2026-08-19-template-content-under-dot-template.md) no longer lists `.agents/` among the template content; this note owns the corpus's home.
