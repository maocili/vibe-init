# Agent Note: Documentation information architecture

Status: implemented

## Problem

The root README, the docs index, requirements, and design each repeated the plugin's status, command
surface, scope boundary, and repository layout. Repeated prose made the public entry long and allowed
otherwise small changes to leave contradictory paths or stale test counts behind.

## Decision

The root README is the concise user entry: initialize a project, select features, mount the local
plugin, and run tests. `docs/README.md` is navigation only. REQUIREMENTS retains the scope contract
and defaults; DESIGN retains implementation mechanics; ACCEPTANCE retains evidence; CHANGELOG records
decision-level history. Each fact has one primary home, with links instead of duplicated explanations.

## Alternatives considered

**Keep every document self-contained.** This avoids link-following but duplicates the command surface
and status in five places, recreating the drift that prompted the change.

**Put all detail in the root README.** This is convenient for a first read but buries normative and
maintainer material in an operational guide.

## Consequences

Future user-facing changes start in the root README, contractual changes in REQUIREMENTS, and engine
changes in DESIGN and ACCEPTANCE. A documentation change that changes one of those boundaries updates
its owning document rather than copying the same prose elsewhere.
