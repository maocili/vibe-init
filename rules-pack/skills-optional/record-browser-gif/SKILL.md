---
name: record-browser-gif
description: Use when asked to record or generate a compact, verified GIF of a browser or Web UI workflow, or when project policy requires GUI evidence; capture truthful states, encode deterministically, inspect the artifact, and publish only under an explicit publication policy.
---

# Record a Browser GIF

Produce a short, truthful UI demonstration as a local GIF. Recording and remote publication are
separate actions; publish only when the task explicitly includes attaching the artifact to a pull
request or when a project publication policy explicitly authorizes another destination.

## Confirm the evidence boundary

Confirm the requested scenario, source revision, transport, privacy constraints, and whether the project
requires a real server, API, or model flow. Record the exact revision and setup before capture. Never
substitute fixture queries, mock transports, synthetic events, or test-only hooks for a real-flow
request. If credentials, the server, or the requested browser capability is unavailable, report the
limitation instead of silently changing the evidence claim.

Require a clean source revision before starting and record its immutable commit SHA before build or
capture. If an explicitly authorized dirty-state recording is
unavoidable, record the exact exception and do not claim a clean revision. Use fresh isolated browser
and application state when possible; if a fresh context cannot be created, clear the origin's cookies
and site storage and report that exception. Keep credentials, private workspaces, unrelated tabs,
personal data, and transient notifications out of the recording. Do not read or expose credential
values.

## Stage the application

Build or start the application from the recorded revision through the project's declared command. Use
fresh server, application, workspace, session, and browser roots for each storyboard; every frame in one
GIF must come from that one evidence run. If fresh server, application, workspace, or session roots are
unavailable, reset them through the project's supported mechanism or stop and report the isolation gap;
do not silently reuse state. Invoke the available browser-control skill
and follow its setup, interaction, cleanup, and allowed capture-root rules. Use
the available browser-control path when one exists; use an existing browser state only when requested
or required, record that exception, and do not claim fresh state. If browser control is unavailable,
use a project-declared Playwright dependency in an isolated browser and report that fallback; do not
install another driver or launch the user's browser without authorization. When a production default
opens an OS-only surface, select an official browser-operable production backend through normal
configuration and report the override.

Use the application's normal credential configuration path for real runs and a benign demonstration
prompt; never read or expose credential values. Before capture, record the exact origin, whether the
application is built or in development mode, the transport, and whether fixture or mock mode is active.
When replacing a running server, terminate it by its recorded PID or an exact command-line match; never
use a broad kill pattern.

If capture automation fails, discard its frames and rerun from fresh state roots. Never splice frames
from separate runs or claim that a local build demonstrates a different revision.

## Record meaningful states

Plan three to six states that tell one story, such as initial, input, running, settled, and relevant
failure or recovery. Prefer semantic transitions and omit uninformative loading churn. Keep one
viewport and crop, readable text, stable browser chrome, and lexically sortable frame names such as
`00-initial.png` and `01-settled.png`.

Before each screenshot, wait for a concrete UI condition: a unique label, enabled control, changed
title, exact text, or completed response. Require a locator to resolve exactly one element; use exact
accessible-name matching when equality is intended. Require completion predicates to observe an
element whose trimmed text equals the expected result, not a body substring. For a tool call,
rejection, recovery, or transient state, capture the tool identity, status or stable error, and
downstream result that proves the claim. Poll a concrete DOM marker and take the screenshot in the same
browser-script call when separate calls could lose the transient state. Do not use a fixed delay as
proof of completion.

For a model-driven flow, make slow work stay in the foreground and use a settle sentinel so the required
state actually occurs. Store frames under the repository's ignored capture directory, creating the frame directory first. Use
the browser's screenshot API and save the returned image bytes directly. Stop an unnecessarily long
real-API run after the demonstrated state is visible.

## Encode the GIF

Use the bundled [`scripts/encode_gif.py`](scripts/encode_gif.py). It requires `python3`, `ffmpeg`, and
`ffprobe`; if a binary is missing, report it instead of installing software without authorization.
Export the skill directory before invoking the script:

```sh
export GIF_SKILL_DIR=/absolute/path/to/.agents/skills/record-browser-gif
python3 "$GIF_SKILL_DIR/scripts/encode_gif.py" \
  /absolute/path/to/frames \
  /absolute/path/to/demo.gif \
  --durations 1.5 \
  --fps 10 \
  --max-width 1200 \
  --colors 128
```

Use one positive duration per frame or a single duration for all frames; when listing durations, provide
one comma-separated value per frame and hold the final settled state longest. The encoder rejects fewer
than two frames, mismatched dimensions or durations, invalid limits, accidental overwrite, unexpected
duration, and output above its byte limit. Reduce width before colors or frame rate when the artifact is
too large; retain readable text. Use `--force` only after resolving the exact output path.

## Verify the artifact

Read the encoder's JSON summary and confirm the output path, source and encoded frame counts, dimensions,
duration, and byte size. Return a portable provenance block with every recording or publication, including
the artifact path, immutable commit SHA, serving tree and exact origin, built/development mode,
transport, fixture/mock status, model-round status, browser-state exceptions, and isolation exceptions.
Place the same block beside any remote attachment or its embed. Report provenance in the evidence record for every recording or publication,
including the immutable commit SHA, serving tree or artifact origin, and whether a real model round ran.
Confirm the exact source revision, setup,
transport, mode overrides, browser fallback, and isolation exceptions for the evidence record. Visually
inspect the encoded GIF itself, not only source frames; if the viewer
shows only the first frame, decode representative encoded frames and inspect their order and final hold.
Confirm the transition is legible and the final settled state is held long enough; render the local GIF
when the client supports it. Confirm no sensitive or unrelated content appears. Run `git status --short` and verify frames and the
artifact are only under ignored paths. Return the absolute GIF path and state whether the recording used
a real flow, fixture, or another transport. If no remote attachment is requested, stop here.

## Publish only when authorized

When the task includes a pull-request attachment or an explicit project publication policy, use that
policy's dedicated asset workflow. If the authorized destination has no supported publication or
verification workflow, stop and report it; do not improvise a remote upload.
Do not mutate remote state while recording. Do not commit the GIF to the product branch or a long-lived
branch unless that policy explicitly requires it. For PR assets, use an isolated checkout and dedicated
media-only append-only history; verify the staged checksum matches the verified artifact and the
product/PR branch is untouched. Before pushing, verify the artifact checksum and media-only destination.
After remote publication,
verify the retrieved asset path, size, checksum, response, media type, and rendered embed or preview
through the destination's authenticated review path; render the local GIF when the client supports it.
If the destination is a pull request, immediately before editing its body, re-read its live head and
compare it with the recorded immutable SHA; stop and re-record if it moved. After editing, re-read the
head and require it still equals the recorded immutable SHA. Verify the body contains a provider-neutral
direct renderable media attachment or URL, the provenance block is beside it, and the rendered body or
preview is valid through the destination's authenticated review path—not only source Markdown or a
file-view page. Never delete or force-push a published asset history.
