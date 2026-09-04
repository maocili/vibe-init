---
name: record-browser-gif
description: Use when asked to record a browser workflow as a compact, verified GIF demonstration.
---

# Record a Browser GIF

Confirm the requested scenario, source revision, transport, and privacy constraints before capture. Use fresh isolated browser state when possible and record a small storyboard of meaningful states. Wait for concrete UI conditions; never use a fixed delay as proof of a state transition.

Keep one viewport, lexical frame names, readable text, and no secrets, unrelated tabs, or personal data. Capture tool, failure, or recovery status as well as final output.

Use the bundled `scripts/encode_gif.py` to encode lexically ordered PNG frames. It requires `python3`, `ffmpeg`, and `ffprobe`, checks frame dimensions and final duration, and emits a JSON summary. For example:

```sh
export GIF_SKILL_DIR=/absolute/path/to/.agents/skills/record-browser-gif
python3 "$GIF_SKILL_DIR/scripts/encode_gif.py" /absolute/path/to/frames /absolute/path/to/demo.gif \
  --durations 1.5,1.5,3.5 --fps 10 --max-width 1200 --colors 128
```

Visually inspect the encoded GIF, verify its dimensions and byte size, and return its absolute path. Publish remotely only when separately authorized.
