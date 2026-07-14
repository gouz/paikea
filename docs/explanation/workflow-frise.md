# The workflow frise

The row of steps across the top — the *frise* — is more than decoration. It is
how paikea ties a free-form chat to the structured OpenSpec lifecycle. This page
explains what it represents and how it shapes a session.

## What the steps are

The frise always opens with **Discuss**, a free-form step that never touches
OpenSpec. After it come the real artifacts of the active change —
**Proposal**, **Design**, **Specs**, **Tasks** — followed by **Apply**
(implementation) and **Archive**.

Those middle steps are not hard-coded. paikea shells out to the OpenSpec CLI
(`openspec list`, `openspec status`) and reads the artifacts of the change
you're working on. If the CLI isn't installed or the directory isn't an OpenSpec
project, the frise collapses to just **Discuss** and paikea behaves as a plain
chat.

## Which change is "active"

When several changes exist, paikea picks the most recently modified one that
isn't complete or archived, falling back to the most recent overall. Each step's
done/pending state comes from that change's real artifact status, and the
earliest not-done step is highlighted as *current* — the natural thing to work
on next.

## Why the selected step matters

Selecting a step is not just navigation; it reconfigures the session:

- **Prompt suggestions** change to starters appropriate to the step.
- **Skills** are filtered — step-specific `openspec-*` skills are offered only
  on the steps they belong to.
- **Guidance** for that step is injected into the model's system prompt (for
  example, *Proposal* tells the model to run `openspec new change`, write
  `proposal.md`, and open a `feat/<name>` branch — while forbidding any
  implementation code until *Apply*). This guidance is also what drives the
  git automation described in
  [Drive the OpenSpec workflow](../how-to/drive-the-workflow.md).

So moving to `/specs` doesn't just move a highlight — it changes what paikea
tells the model to do next.

## Selecting vs. tracking

paikea distinguishes the *detected current* step (from the filesystem) from the
*selected* step (what you're pointing at). It defaults the selection to the
current step and refreshes after each turn, but you stay in control: a slash
command or the palette moves the selection wherever you want, and it is clamped
if the underlying change changes shape.

To actually move between steps, see
[Drive the OpenSpec workflow](../how-to/drive-the-workflow.md).
