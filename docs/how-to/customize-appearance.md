# Customize the appearance

## Switch theme

paikea ships five marine themes: `deep-sea` (default dark), `dawn` (light),
`storm`, `lagoon`, and `polar-night`.

- **From the UI:** press **Ctrl+P**, scroll to a `Theme: …` entry, press
  **Enter**. The whole interface recolors immediately and the choice is saved.
- **From config:** set `"theme": "lagoon"` in `~/.paikea/config.json`.

On first run with no saved theme, paikea picks `dawn` for light terminals
(detected via `COLORFGBG`) and `deep-sea` otherwise. A theme name that no longer
exists falls back to `deep-sea`.

## Scroll the output

Both the thinking and response panes scroll independently. The scroll keys act
on the **focused** pane (its border is drawn in the accent color):

- **↑** / **↓** — one line
- **PageUp** / **PageDown** or **Shift+↑** / **Shift+↓** — five lines

Offsets count from the bottom, so `0` follows the latest output. Sending a new
prompt re-anchors both panes to the tail.

## Move focus between panes

When a thinking pane is on screen, press **Ctrl+T** to move scroll focus between
it and the response pane. Use it to scroll back through a long chain of thought
while the answer stays put.

## Show or hide the thinking pane

**Ctrl+P → Toggle Thinking Pane** hides or shows the pane without changing
whether the model reasons. (To change *whether the model reasons*, use
**Model Thinking** instead — see
[Speed up responses](speed-up-responses.md).)

See also: [Keyboard shortcuts & commands](../reference/keybindings.md).
