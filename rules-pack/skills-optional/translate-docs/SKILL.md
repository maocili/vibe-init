---
name: translate-docs
description: Use only when explicitly asked to translate or reconcile a bilingual documentation pair in a project that enables bilingual document discipline.
disable-model-invocation: true
user-invocable: true
---

# Translate Documentation Pairs

Use only by explicit invocation and only when the project enables bilingual document discipline. Read its pairing policy, terminology, style guidance, and verification commands before translation. Apply [documentation-standards](../documentation-standards/SKILL.md) and [prose-standard](../prose-standard/SKILL.md) to both sides.

## Choose the update path

- **Existing pair:** use the project's briefing tool when available to identify the smallest aligned paragraph, list item, table row, section, or document that covers the source diff. Preserve reviewed text outside that scope. Apply a code-fence-only change mechanically only when the pair policy permits it and a structural check confirms the result.
- **New pair:** translate the full document into the counterpart language, preserving heading hierarchy, list and table order, links, inline code, and required fenced code. Keep both languages equally authoritative.
- **Rename or deletion:** move or remove both documents and their sidecar record together.

Never translate, re-record, or repair a sealed archived Agent Note triplet.

## Translate and review

Write as a native technical author, not a sentence-by-sentence transposer. Preserve every source proposition without adding behavior, warnings, or examples. Apply declared terminology before translating unfamiliar terms; leave an unresolved term according to project policy instead of inventing a rendering. Check the counterpart clause by clause against the source, then read it independently for natural technical prose.

## Record and verify

Record the consistency pair only after semantic review. Run the scoped pairing verifier for the changed pair, then the project documentation gate at the change level. A structural or hash-green result does not prove semantic fidelity, terminology, or tone; report those as reviewed judgment. Keep the heavy workflow explicit-only and do not invoke it for routine paired-document updates.
