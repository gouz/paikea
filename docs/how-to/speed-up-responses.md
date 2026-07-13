# Speed up responses

On small local models, responses are gated by two things: how long the model
spends reasoning, and how many tokens it must read every turn. paikea is already
tuned for speed out of the box, but here is how to push it further.

## Keep reasoning off (default)

Chain-of-thought is **disabled by default** — the model answers directly. If you
turned it on and want speed back, turn it off again:

- **From the UI:** press **Ctrl+P**, select **Model Thinking: off**, Enter.
- **From config:** set `"thinking": false` (or remove the field) in
  `~/.paikea/config.json`.

The choice is persisted, so it survives restarts.

## Enable reasoning only when you need it

Reasoning helps on hard, multi-step questions and hurts on quick ones. Toggle it
per task from the palette rather than leaving it on globally.

## Give the model more room

The context window is fixed when Docker Model Runner loads the model. If answers
get truncated or the model "forgets" earlier turns, raise it:

```bash
docker model configure <model> --context-size 16384
```

A larger window gives more room for the conversation, but it does **not** make
each turn faster — reducing what the model must read does.

## What paikea already does for you

- **Small system prompt.** Skill instructions are not injected in full; the
  prompt lists them as a manifest and the model loads a skill's full text on
  demand with the `read_skill` tool. This keeps the per-turn prompt roughly 16×
  smaller than injecting every skill body.

If you want the reasoning behind these choices, read
[Speed & context on local models](../explanation/speed-and-context.md).
