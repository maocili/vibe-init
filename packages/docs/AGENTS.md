# AGENTS.md — Documentation standard

This subtree owns the repository's human-facing documentation. Keep stable scope and evidence in
`docs/`; record rationale, architecture choices, and decision history in [Agent Notes](../.agents/notes/README.md).
The root [AGENTS.md](../AGENTS.md) carries session-wide standing orders.

## Placement and structure

Classify each document as a tutorial or reference before writing. Tutorials lead a reader through an
ordered outcome; references define the current lookup scope. Give every fact one home and link to it
from other documents. Keep implementation rationale and change stories in Agent Notes, not in stable
contract pages. Use relative Markdown links and keep every target valid.

## Current-state prose

Describe the live mechanism rather than commits, pull requests, old implementations, or temporary
migration narration. Keep incident chronology in postmortems and durable rationale in Agent Notes.
Comments document non-obvious behavior, failure, timing, ownership, and safe use; they do not narrate
control flow, tests, or review discussion. Change generated catalogs through their source or generator,
not by editing a derivative. Do not repeat a fact in several homes when one link preserves the needed
context.

## Wordcount budgets

The [budget manifest](../.vibe-init/toolchain/scripts/doc-budgets.manifest.json) sets mechanical
ceilings for standing documents. Current ceilings are 1900 words for the root `AGENTS.md` and 1320
words for this file. These are guardrails, not reduction targets.

Editorial targets are stricter: root `AGENTS.md` ≤1600 words, ordinary subtree `AGENTS.md` ≤600 words,
and this file ≤1250 words. Keep at least 5% headroom below the applicable target. When a gate is red,
first relocate content to its owning tier, then condense it; raise a ceiling only when the content
needs the space and record the justification in the same change.

Agent Notes, code comments, and generated toolchain files are outside this document-tier budget unless
they are explicitly listed in the manifest. Run the gate from the project root:

```bash
pnpm -C .vibe-init/toolchain run verify-doc-budgets --list
```

This instruction file is maintained in English only like the root `AGENTS.md`; the bilingual pairing
gate excludes instruction files.
