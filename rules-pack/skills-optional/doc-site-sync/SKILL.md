---
name: doc-site-sync
description: Use when publishing, moving, or diagnosing projected documentation in a project with a configured documentation site.
---

# Synchronize a Documentation Site

Use only after locating the project's site configuration, source-to-site mapping, and build command. Canonical documentation remains in its owning tree; generated site output is disposable and is never edited by hand.

For an edit change the canonical page only. For a new page add it in the correct documentation tier and publication mapping. For a move or deletion update source, mapping, and inbound links atomically. Run the project-declared site validation. Stop when no site is configured; do not invent a VitePress, deployment, or navigation model.
