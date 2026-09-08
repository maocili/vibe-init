## Agent Notes

Changes to behavior, architecture, shared contracts, process or tooling, test strategy, or persistent formats require an Agent Note; follow the [Agent Note rules](.agents/notes/README.md) and use the `archive-agent-notes` skill when writing or changing one.

## Run relevant checks locally

Before pushing or requesting review, use the [pre-push checks skill](.agents/skills/pre-push-checks/SKILL.md) to select the smallest project-declared evidence for the complete outgoing change. Do not repeat unchanged checks owned by the next Git hook, report only commands actually run, and leave exhaustive or platform-matrix coverage to CI when the project provides it unless the task explicitly requires a full local rehearsal.
