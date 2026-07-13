# Getting started

This tutorial takes you from nothing to a running paikea session and your first
OpenSpec change. Follow every step in order; by the end you will have chatted
with a local model and switched between workflow steps.

You will need [Bun](https://bun.sh) (v1.3+) and
[Docker Desktop](https://www.docker.com/products/docker-desktop/) with Model
Runner enabled.

## 1. Pull a model

paikea talks to whatever models Docker Model Runner has loaded. Pull one:

```bash
docker model pull ai/qwen3
```

## 2. Install and run

From the project directory:

```bash
bun install
bun run dev
```

The full-screen interface opens. Along the top you see the masthead (`🏄 paikea`
and the active model), then the **workflow frise** — a row of steps
(`Discuss`, `Proposal`, `Design`, …). At the bottom is the prompt, showing
`cast off — set a course…`.

## 3. Have a conversation

Type a question and press **Enter**:

```
What does this project do?
```

The response streams into the response pane. Responses are direct by default —
the model answers without a visible reasoning step.

## 4. Turn on reasoning (optional)

Press **Ctrl+P** to open the command palette, move to **Model Thinking: on**
with the arrow keys, and press **Enter**. Ask another question — this time a
**thinking** pane appears above the response and shows the model reasoning
before it answers. Press **Ctrl+T** to move scroll focus to the thinking pane,
then **↑**/**↓** to scroll through it.

Toggle it back off from the palette when you want speed again.

## 5. Move through the workflow

The frise mirrors the OpenSpec lifecycle. Switch to a step by typing a slash
command. Type `/` and watch the suggestion appear; press **Tab** to complete
`/proposal`, then **Enter**:

```
/proposal
```

The selected step in the frise moves to **Proposal**, and the status bar shows
`cap proposal`. Nothing was sent to the model — a slash command only changes the
step, which in turn changes the prompt suggestions and the guidance paikea gives
the model. Try `/discuss` to go back.

## 6. Quit

Press **Esc** once (paikea asks you to confirm), then **Esc** again.

## Where to go next

- Point paikea at a different runner: [Configure the DMR connection](../how-to/configure-dmr-connection.md)
- Make answers faster: [Speed up responses](../how-to/speed-up-responses.md)
- Look up every key: [Keyboard shortcuts & commands](../reference/keybindings.md)
- Understand the frise: [The workflow frise](../explanation/workflow-frise.md)
