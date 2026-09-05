---
name: translate-docs
description: Use only when explicitly asked to translate or reconcile a bilingual documentation pair in a project that enables bilingual document discipline; preserve structure, terminology, reviewed text, and consistency records.
disable-model-invocation: true
user-invocable: true
---

# Translate Documentation Pairs

Run this extended workflow only when the user invokes `translate-docs` by name and only when the project enables bilingual
document discipline. Use [documentation-standards](../documentation-standards/SKILL.md) for ordinary
documentation placement. If the feature is disabled or the pairing policy is unavailable, stop and report
that the workflow is unsupported. Never load it from another Skill or from an inferred translation
need. Routine counterpart updates follow the project's lightweight documentation path and do not load
this Skill automatically.

## Read the pairing contract

Read the project's pairing policy, terminology source, style guidance, generated-document policy, and
verification commands before translating. In a dsh-vibe project these may be under
`.dsh-vibe/toolchain/docs/i18n/`; use the paths and commands that actually exist. Both language files
carry equal authority: the authored side supplies the source for the update, and the counterpart must
preserve its meaning without adding behavior or warnings. Enumerate missing, out-of-sync, renamed, and
sealed pairs before selecting the write set.

## Triage by change type

- **Existing pair:** update only the smallest aligned paragraph, list item, table row, heading section,
  or document that covers the source diff. Never re-translate unchanged content; preserve its reviewed
  phrasing.
- **New pair:** translate the full document while preserving heading hierarchy, list and table order,
  links, inline code, and required fenced code.
- **Rename or deletion:** move or remove both language files and the `.i18n.yaml` consistency record
  together.

Never translate, re-record, or repair a sealed archived Agent Note triplet.

## Update an existing pair

1. Use the project's briefing command when available. Its briefing must identify the narrowest aligned
   unit, three-way source/counterpart context, affected terminology, first-occurrence changes, and the
   rule digest; use it as the working set instead of re-deriving broad history or corpus diffs.
2. If every change is inside byte-identical code fences and the policy provides a structure-checked
   mechanical apply mode, use it. Do not use mechanical replacement for prose.
3. For a prose diff, use the briefing as the working set. Escalate to the whole-document sources only
   when the briefing leaves an unanswerable terminology or alignment decision.
4. Rewrite the smallest counterpart region as native technical prose. Verify every changed clause
   against the authored side: nothing added or dropped, terminology follows the declared source, and
   code spans remain verbatim.
5. Read the completed counterpart alone for natural phrasing before recording consistency.

## Translate a new pair

When a prose update or full/new translation is required, delegate it to a subagent. The translator reads
the pairing contract, terminology, style, and generated-source policy first, then writes only final text;
the orchestrator does not translate directly or re-translate unchanged content. For a full translation,
use an explicit second pass: compare clause by clause with the source, match the nearest approved style
sample, then review the counterpart alone for naturalness. Translate section by section for long documents while keeping the
structure locked to the source; do not fix structural drift only at the end.

Use the target language's established technical terms. If a term is unresolved, follow the project
policy for pending terminology or retain the source term; never invent an inline rendering that changes
the contract. Enforce glossary rows and prohibited terms. Require cited precedent or source-term
retention plus a pending-term record for unresolved terms, and update the shared terminology source when
a term is decided. Read the completed counterpart without the source beside it and correct awkward
phrasing without changing meaning.

## Preserve pair structure

Keep headings, list kinds and starts, table dimensions, link targets, inline code, and fenced code aligned
with the source. Code blocks that the policy defines as shared are byte-identical, including comments.
Keep the required language switcher links exactly where the pairing policy specifies them. If a
generator owns the switcher or other output, preserve its output byte-for-byte and apply only documented
counterpart exceptions. A green
structural or hash gate proves only the recorded bytes and shape; it does not prove semantic fidelity,
terminology, or tone.

After structural checks, manually compare list and table order and numbering, inline code, emphasis,
link-target invariance, meaning, terminology, and tone. Keep every edited language file, its
counterpart, and its consistency record in the same change; for hash-based records, report both sides'
full-content hashes.

## Record and verify

Record consistency only after semantic review. Use the project's scoped pairing command and name the
exact pair being confirmed; do not re-record the entire corpus as a side effect of one update. Run the
scoped pair check for each pair, then leave corpus-wide documentation gates to the change, PR, or CI
level. In a dsh-vibe project, use the enabled commands under `.dsh-vibe/toolchain/package.json` rather
than guessing commands from another repository. Terminology decisions from review update the shared
terminology source, not only the individual document.

Report whether the pair was new or minimally updated, any pending terminology, the source side, and the
exact checks run. Keep this extended workflow explicit-only; do not invoke it for ordinary documentation
work or from another Skill merely because a `.zh.md` file exists.
