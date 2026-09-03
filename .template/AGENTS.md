# AGENTS.md — Repository standing orders

This repository is a template for vibe-coding projects: it carries the documentation discipline, decision-record rules, bilingual-pairing contract, and doc gates worth copying into any new project. The template ships no product code; scaffold your project on top of it and keep the rules it documents.

- **Documentation follows the tier taxonomy in [docs/AGENTS.md](docs/AGENTS.md).** Every fact has one home; link there from anywhere else. Do not restate rules in this file that a linked home already carries.
- **Every non-trivial change ships with an Agent Note.** A change is non-trivial when it alters behavior, contracts, structure, process, tooling, testing strategy, or any on-disk, wire, or configuration format; write or update the note per [.agents/notes/README.md](../.agents/notes/README.md) in the same change.
- **Documentation in scope is maintained as equal-authority English/Chinese pairs.** The pairing contract lives in [docs/i18n/README.md](docs/i18n/README.md); after editing either side, update the counterpart and re-record with `pnpm run verify-translation-pairing --write <pair>`.
- **Run `pnpm run doc-sync` before committing doc or note changes.** It verifies link integrity, paragraph wrapping, doc budgets, note format, archived-note integrity, pairing consistency, skill metadata, and `ts` fences.
- **Write a postmortem when a subtle, systemic bug escapes to production or a merged change.** The incident format and criteria live in [docs/postmortem/README.md](docs/postmortem/README.md).
- **Skills under `.agents/skills/` are authoring examples, not standing orders.** Model your own skills on their format; do not treat their deepseek-harness references as this repository's workflow.
