# Agent Notes

English | [中文](README.zh.md)

One kind of design document lives in this directory. An **Agent Note** records a decision or
proposal that affects this codebase — the *why* and what we gave up, the parts code and prose cannot
carry. This README defines where notes live, when to write one, and the in-file format. The standing
order in the [project root's AGENTS.md](../../AGENTS.md) points here. The initializer owns this
explainer and its pairing metadata; dated notes remain project-owned during upgrades.

## Layout and naming

Every Agent Note has two path-encoded axes: lifecycle and class. Its lifecycle is also its status:

- **proposed/** — proposals not yet built (or only partly built).
- **implemented/** — the decision shipped. The note is kept current with what actually shipped: when
  code later moves a file, renames a package, or changes a key/default, update the note's facts in the
  same change. See [implemented/AGENTS.md](implemented/AGENTS.md).
- **rejected/** — considered and declined. Keep it only while its verdict prevents a tempting mistake;
  otherwise delete the note and its records.
- **archived/** — frozen historical snapshots of implemented notes that no longer guide current work.
  See [archived/AGENTS.md](archived/AGENTS.md).

Classes are the nested folder under every lifecycle:

| Class | Covers |
| --- | --- |
| `feature` | A user- or agent-visible capability. |
| `bug-fix` | A defect correction or gap closed after an incident. |
| `simplification` | Removal of code, behavior, or surface area without a new capability. |
| `architecture` | A structural decision about shipped source and its ownership. |
| `process` | Tooling, policy, or workflow around the code. |
| `testing` | Test infrastructure or test strategy. |

Name every note `lifecycle/class/yyyy-mm-dd-topic-title.md` — the date is when the topic was first
proposed (per git history). Cross-references between notes use relative Markdown links, never bare
prose, so they are mechanically checkable and survive moves between folders. Do not add a centralized
index: the tree itself is the inventory.

## When to write one

Every non-trivial change MUST add or update at least one Agent Note in the same change. A change is
non-trivial when it alters behavior, architecture, a contract shared across files or packages, process
or tooling, testing strategy, an on-disk/wire/config format, or another decision a maintainer may
reasonably revisit. A proposal for substantial future work starts in proposed/; a decision already
made starts in implemented/. Updating the note that already owns the decision satisfies the rule — do
not create duplicates. Only a purely mechanical or local edit with no behavioral consequence is exempt.

A new note triggers a **supersession check**: search the active tree for older notes covering the same
decision or mechanism. Full supersession is consolidated into the owning note — preserving every unique
rationale, alternative, consequence, and required verification — then the old note is deleted together
with its sibling records. Partial supersession keeps both notes active and cross-linked.

## The file format

The first three lines of every note are exactly:

```markdown
# Agent Note: <title>

Status: <proposed | implemented | rejected — why, in one line>
```

followed by a blank line. The Status: value must agree with the lifecycle folder the note sits in
(proposed/ rejected/ implemented/; archived notes keep Status: implemented plus an Archived: line).

Every note opens its body with **## Problem** — the motivation, written to stand without the solution.
What follows depends on the lifecycle:

- **proposed/**: ## Proposal (may speak in future tense — plans and open questions belong here),
  optional bespoke sections, ## Alternatives considered, ## Acceptance criteria, ## Risks.
- **implemented/**: ## Decision (present tense, kept current), bespoke sections, ## Alternatives
  considered, ## Consequences. Proposal-era headings (## Proposal / ## Acceptance criteria) do not
  belong here.
- **rejected/**: the proposal frozen; only the Status: line carries the verdict.

**## Alternatives considered is mandatory in every note**: each genuine alternative and why it lost,
one bold-led paragraph per alternative. A decision recorded without what it beat invites re-litigation.

## Archiving

Archive an implemented note when its decision is complete and its rationale is unlikely to guide future
work; keep it active while its alternatives, ownership boundary, negative guarantee, durable semantics,
security rule, or reintroduction condition remains useful. Never archive a proposed note — reject an
obsolete proposal instead. Keep a rejected note only while it prevents a plausible future mistake;
otherwise delete its complete record.

Archiving moves the complete English/Chinese/sidecar triplet from `implemented/<class>/` to
`archived/<class>/`, adds the same `Archived: YYYY-MM-DD` line below `Status: implemented` in both
languages, re-records the sidecar, and repairs or removes inbound links. The archive manifest then seals
the artifact hashes append-only. Once sealed, an archived triplet is permanently frozen: do not edit,
translate, reformat, move, delete, or repair outbound links from it.

## Chinese counterparts

A .zh.md counterpart mirrors its English sibling section-for-section; the machine-checked header tokens
(`# Agent Note: ` and the `Status:` line) stay in English verbatim. The pairing is declared in
[README.i18n.yaml](README.i18n.yaml); projects without the bilingual feature simply keep .md only and
ignore the sidecar.
