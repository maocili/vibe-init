# Archive operations

Use this workflow only after the project's Agent Note rules declare the record format, archive path,
and verifier. If no archive format or validation path exists, stop and report that archiving is
unsupported.

## Archive an implemented record

When the project declares a bilingual triplet:

1. Run the normal read-only archive verifier first. Reject any changed or missing sealed artifact.
2. Move `foo.md`, `foo.zh.md`, and `foo.i18n.yaml` together from `implemented/<class>/` to
   `archived/<class>/`; do not retain `implemented` in the destination path.
3. Make no body edits. Add only `Archived: YYYY-MM-DD` immediately below `Status: implemented` in both
   language files, using the same date.
4. Mechanically re-record the sidecar hashes for those metadata-only edits. Do not translate,
   reformat, update facts, or repair links inside the record.
5. Repair inbound links from active prose. Redirect them to current authority, retain an archived link
   only for an intentional historical citation, or remove the link.
6. Run the declared append-mode verifier for the archive-wide unsealed set. Use a triplet path only
   when the verifier explicitly supports path-scoped sealing. Then run the normal read-only verifier
   and applicable documentation gates.

For a declared single-language format, apply the same sequence to the complete record without
inventing a sidecar. The archive manifest is append-only: prove existing seals first, add only new
hashes, and never rewrite prior entries to make a changed artifact pass.

In a default vibe-init toolchain, the read-only verifier is:

```sh
pnpm -C .vibe-init/toolchain run verify-archived-agent-notes
```

Use its documented `--write` mode only after confirming the complete unsealed set and existing seals.
Run the toolchain's relevant `doc-sync` and `lint` scripts afterward when present. Do not claim archived
outbound links are valid when the verifier intentionally excludes them.

## Delete a rejected record

Delete the complete declared record or triplet only after the retention audit establishes that its
rationale no longer prevents a plausible mistake. Repair or remove every inbound link in the same
change. Rejected records are not sealed archive artifacts; never delete a sealed artifact under this
workflow.

## Re-establish current rationale from history

Never unarchive or copy a sealed artifact back into an active lifecycle. If its rationale becomes
current again, create a new active Agent Note only when the user requested that change. State the
present decision and evidence in the new record, cite the archived snapshot as history, and follow the
ordinary supersession workflow. The sealed files and manifest remain unchanged.
