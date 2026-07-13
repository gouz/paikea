# Architecture

This page explains how paikea is put together and why. It is background reading,
not a how-to — you don't need any of it to use the tool.

## A terminal app built like a web app

paikea renders with [Ink](https://github.com/vadimdemedes/ink), which is React
for the terminal. The interface is a tree of components laid out with flexbox
(Yoga), and it re-renders from state exactly like a browser app would. That
choice is what makes the marine theming, live scrolling, and pane focus feel
natural to build — they are just props and state, not cursor arithmetic.

The screen is a fixed vertical stack:

```
Header        masthead: logo, model, horizon rule
Timeline      the workflow frise
─ content ─   thinking pane (conditional)
              agent steps  (conditional)
              response pane (fills remaining height)
PromptInput   the input line + suggestions
StatusBar     model, current step, hints
```

The three content panes share the flexible middle region; the layout hook sizes
them from the terminal height, capping the thinking and agent-step panes so the
response always keeps room.

## State lives in one place

All UI state is a single object in `App.tsx`. There is no store and no context —
the app is small enough that one `useState` and a merge helper (`update`) are
clearer than any abstraction. Keyboard handling is one `useInput` callback that
branches on mode (normal vs palette) and key.

This centralization is deliberate: features like scroll focus or the thinking
toggle touch a couple of fields and one or two components, and you can see the
whole flow in a single file.

## The agent loop

Submitting a prompt runs an agent loop (`runAgentLoop`). It streams a completion
from the model; if the model asks to call tools, paikea executes them, appends
the results as `tool` messages, and streams again — up to a fixed iteration cap.
When a completion arrives with no tool calls, that text is the final answer.

Streaming is Server-Sent Events from the Docker Model Runner OpenAI-compatible
endpoint (`dmr-client`). Each chunk is classified as reasoning
(`reasoning_content`), content, or a tool-call fragment, and routed to the
thinking pane, the response pane, or a tool-call accumulator respectively.

## Services and registries

Logic that isn't UI lives under `src/services/` and the registries:

- **dmr-client** — talks to the model runner (streaming, tool payloads,
  thinking control).
- **openspec-hook** — shells out to the OpenSpec CLI to build the frise and the
  per-step guidance.
- **skills / rules / tools registries** — load bundled defaults plus project
  overrides from `.paikea/` and `.claude/`.
- **state/config, state/session** — the JSON config and saved conversations
  under `~/.paikea/`.

The system prompt for a turn is assembled from these: a skills manifest,
the rules, and the active step's guidance. Keeping that assembly cheap is a
recurring theme — see [Speed & context](speed-and-context.md).
