# Drive the OpenSpec workflow

paikea's frise mirrors the OpenSpec lifecycle. The selected step shapes the
session: the prompt suggestions, the guidance injected into the model's system
prompt, and which skills are offered. This guide shows how to move between
steps.

## Switch step with a slash command

Type a `/` command and press **Enter**:

```
/proposal
```

The active step changes; nothing is sent to the model. The commands come from
the steps currently in the frise:

`/discuss` · `/proposal` · `/design` · `/specs` · `/tasks` · `/apply` · `/archive`

## Let autocompletion do the typing

As soon as the prompt starts with `/`, the matching command is shown as a
suggestion. Type a few letters and press **Tab** to complete it:

- `/de` + Tab → `/design`
- `/ap` + Tab → `/apply`

## Shorthands

You don't have to type the full id:

- **Unique prefix** — `/pro` resolves to proposal, `/ta` to tasks.
- **Alias** — `/propose` is accepted for proposal.
- **Ambiguous input is ignored** — `/d` (both *discuss* and *design*) does not
  switch; type one more letter.

If a slash string isn't a valid command it is sent to the model as an ordinary
prompt, so `/` text is never lost.

## The palette still works

The command palette (**Ctrl+P**) also has **Step: Previous** / **Step: Next**
entries, and **Refresh Workflow** to re-read the frise from the OpenSpec CLI
after you create or advance a change.

## Git follows the workflow

As you move through the steps, the `openspec-git` skill keeps git in lock-step
with the OpenSpec lifecycle — the model drives the `git_*` tools at the right
moments, so each change gets its own branch and a clean, per-task history:

| Step | What happens | Tool |
|------|--------------|------|
| **Proposal** | A dedicated branch `feat/<change-name>` is created before any design or code | `git_propose` |
| **Apply** | Each finished task is committed on its own (conventional-commits + gitmoji) | `git_commit` |
| **Archive** | The change is archived, the result committed, and the branch merged into `main` | `git_archive` |

`main` only ever receives a change through the archive merge — never a direct
commit. On a repository with an `origin` remote, the branch and `main` are pushed
too; a purely local repo just keeps the merge.

Note that the pre-`apply` steps (proposal, design, specs, tasks) only produce
OpenSpec artifacts — paikea instructs the model **not** to write implementation
code until the **apply** step.

See also: [The workflow frise](../explanation/workflow-frise.md) ·
[Built-in tools](../reference/tools.md).
