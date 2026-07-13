# Speed & context on local models

Local models feel slower than hosted ones, and the reasons are specific and
fixable. This page explains what actually costs time in a paikea turn, and the
design choices paikea makes because of it. For the knobs themselves, see
[Speed up responses](../how-to/speed-up-responses.md).

## Two clocks: prompt-eval and generation

A turn has two costs. First the model must **read** the whole prompt — the
system prompt plus the conversation so far — before it can emit a single token.
Then it **generates** the answer token by token. On a small quantized model
running locally, prompt-eval is often the larger, and it is paid *every turn*
because the prompt is re-read each time.

The practical consequence: the length of your system prompt is a latency tax on
every message, not a one-time cost.

## Why the system prompt is a manifest

Earlier, paikea injected every skill's full `SKILL.md` body into the system
prompt. That was around 3,000 tokens of instructions the model re-read on each
turn — measured at roughly four seconds of prompt-eval before the first token
appeared, on a 4-billion-parameter model.

So skills became a **manifest**: the prompt lists each skill's name and one-line
description and tells the model to call `read_skill` to load the full text when
a task calls for it. The prompt dropped by about 16×, first-token latency fell
with it, and — just as importantly — the context freed up was returned to the
conversation and the answer.

## The context window is a fixed budget

Docker Model Runner loads a model with a fixed context window (4,096 tokens is
common for small models). Everything competes for it: system prompt,
conversation history, the model's reasoning, and the answer. A bloated system
prompt doesn't just cost time — it crowds out the very space the model needs to
respond, which is why answers can look truncated or forgetful.

You cannot change this per request; the window is set when the model loads
(`docker model configure --context-size`). Enlarging it buys room, not speed —
the way to buy speed is to send fewer tokens.

## Why reasoning is off by default

Thinking-capable models (the Qwen3 family, DeepSeek-R1, the o-series) spend
tokens *reasoning* before answering. On a cramped local context that reasoning
is both slow and space-hungry, and for most quick questions it isn't worth it —
so paikea leaves it off by default and lets you switch it on per task.

When you do disable it, paikea doesn't just hide the output: it tells the model
not to reason at all, via `chat_template_kwargs.enable_thinking = false`, which
the Qwen3 chat template honours. (Prompt-level tricks like appending `/no_think`
are unreliable and were measured to sometimes make things *worse*.) The result
is a direct answer that both arrives sooner and leaves more of the window for
your conversation.

## The through-line

Every one of these choices — the manifest, on-demand skills, reasoning off by
default — is the same idea: **on a fixed, re-read context budget, the cheapest
token is the one you don't send.**
