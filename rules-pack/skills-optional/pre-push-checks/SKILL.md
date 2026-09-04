---
name: pre-push-checks
description: Use before pushing, force-pushing, requesting review, or claiming checks pass for a project change.
---

# Run Relevant Pre-Push Checks

Confirm the checkout and comparison base, then inspect the complete outgoing diff. Select the narrowest available evidence that fails for the changed behavior: focused tests for code, documentation gates for docs, build and artifact smokes for distribution paths, and end-to-end tests for real integrations.

Do not reflexively run a full suite or repeat a passing check solely because another commit or push follows. Broaden validation only when the diff crosses shared contracts, repository-wide behavior, or a project policy requires it. Never expose credentials. Report only commands actually run, failures with evidence, and coverage not exercised locally.
