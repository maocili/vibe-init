---
name: doc-site-sync
description: Use when publishing, moving, or diagnosing projected documentation in a project with a configured documentation site.
---

# Synchronize a Documentation Site

Use this workflow only after locating the project's site configuration, source-to-site mapping, navigation model, and validation command. Stop when no documentation site is configured; do not invent a framework, deployment, or route structure.

## Read the owning contracts

Read the documentation standard, the site configuration, the publication manifest or mapping, and the current generated-output policy before editing. Canonical documentation remains in its owning source tree; projected output is disposable and never edited by hand.

## Classify the change

- **Edit:** update the canonical page and preserve its existing public route.
- **New page:** place the source in its documentation tier, then add the smallest mapping and navigation entry required by the configured site.
- **Move or deletion:** update the source, mapping, navigation, and every inbound link atomically. Preserve redirects only when the project explicitly owns them.
- **Missing or broken page:** trace source discovery, mapping, projection, and build output in that order; do not patch generated output.

## Preserve publication behavior

Read the manifest type or configuration schema before editing it. Keep user-facing labels, ordering, and section placement consistent with the existing site. Do not add copied locale trees, generated Markdown, deployment settings, or a second source of truth unless the project already defines that ownership.

## Preview and validate

Run the declared projection or preview command, inspect affected routes and links, then run the project documentation and site checks. Report canonical sources changed, mapping or navigation changes, public routes affected, and only the checks actually run. Publishing or deploying remains a separate, explicitly authorized action.
