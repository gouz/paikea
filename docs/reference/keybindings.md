# Keyboard shortcuts & commands

## Global

| Key | Action |
|-----|--------|
| `Enter` | Submit prompt (or run a `/step` command) |
| `Escape` | Cancel generation while streaming; when idle, press twice to quit |
| `Ctrl+C` / `Ctrl+D` | Cancel generation, or quit |
| `Ctrl+P` | Open the command palette |
| `Tab` | Accept the current suggestion; if there is none, switch to the next model |
| `Shift+Tab` | Previous model |

## Scrolling

Scroll keys act on the **focused** pane (its border shows the accent color).

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll the focused pane one line |
| `PageUp` / `PageDown` | Scroll five lines |
| `Shift+↑` / `Shift+↓` | Scroll five lines |
| `Ctrl+T` | Toggle scroll focus between the thinking and response panes (only when the thinking pane is visible) |

## Prompt editing

| Key | Action |
|-----|--------|
| `←` / `→` | Move the cursor |
| `Home` / `End` · `Ctrl+A` / `Ctrl+E` | Jump to start / end of the prompt |
| `Backspace` / `Delete` | Delete a character |
| `Ctrl+W` | Delete the previous word |
| `Ctrl+U` | Delete to the start of the line |

## Workflow steps

Type a slash command and press `Enter` to switch step (Tab autocompletes):

| Command | Step |
|---------|------|
| `/discuss` | Discuss |
| `/proposal` (alias `/propose`) | Proposal |
| `/design` | Design |
| `/specs` | Specs |
| `/tasks` | Tasks |
| `/apply` | Apply |
| `/archive` | Archive |

A unique prefix works too (`/pro` → proposal). Ambiguous or unknown slash text
is sent to the model as an ordinary prompt.

`Alt+←` / `Alt+→` also move between steps on terminals that forward Alt+arrow
keys, but slash commands are the reliable path.

## Command palette (`Ctrl+P`)

| Entry | Action |
|-------|--------|
| Switch Model | Cycle to the next available model |
| Refresh Workflow | Re-read the frise from the OpenSpec CLI |
| Model Thinking: on/off | Enable/disable model reasoning (persisted) |
| Toggle Thinking Pane | Show/hide the thinking pane (does not change reasoning) |
| Step: Previous / Next | Move between workflow steps |
| Theme: … | Switch theme (persisted) |
| Clear | Clear the current output |
| Quit | Exit paikea |
