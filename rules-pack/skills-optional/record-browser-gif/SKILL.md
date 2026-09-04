---
name: record-browser-gif
description: Use when asked to record a browser workflow as a compact, verified GIF demonstration.
---

# Record a Browser GIF

Confirm the requested scenario, source revision, transport, and privacy constraints before capture. Record a GIF only when requested or when a project policy explicitly requires it; publication remains a separately authorized action.

## Stage the application

Use the requested revision and record its identifier before starting the application. Use fresh, isolated browser state when possible. Keep credentials, private workspaces, unrelated tabs, and personal data out of the recording. Do not claim a local development build represents another revision.

## Record meaningful states

Plan a small storyboard that demonstrates the requested user flow, including loading, action, result, and any relevant failure or recovery state. Wait for observable UI conditions rather than a fixed delay. Keep one viewport, readable text, stable browser chrome, and lexically sortable frame names. Capture only the frames needed to establish the behavior.

Use the bundled [`scripts/encode_gif.py`](scripts/encode_gif.py) to encode lexically ordered PNG frames. It requires `python3`, `ffmpeg`, and `ffprobe`, checks frame dimensions and final duration, and emits a JSON summary. For example:

```sh
export GIF_SKILL_DIR=/absolute/path/to/.agents/skills/record-browser-gif
python3 "$GIF_SKILL_DIR/scripts/encode_gif.py" /absolute/path/to/frames /absolute/path/to/demo.gif \
  --durations 1.5,1.5,3.5 --fps 10 --max-width 1200 --colors 128
```

Visually inspect the encoded GIF, verify its dimensions and byte size, and return its absolute path. Publish remotely only when separately authorized.
