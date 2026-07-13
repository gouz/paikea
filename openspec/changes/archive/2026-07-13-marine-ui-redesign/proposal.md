# Marine UI Redesign

## Problem

Paikea takes its name from the Māori whale-rider who crossed the ocean, yet
the TUI carries no maritime identity. Its six themes (`dark`, `light`, `nord`,
`dracula`, `tokyonight`) are generic editor palettes, its symbols are neutral
(`●`, `○`, `·`, braille spinner), and its logo/header/status labels read like
any other CLI. There is nothing that makes paikea feel like *paikea*.

## Solution

Give the TUI a coherent **marine identity** end to end:

- **Themes** — replace the six generic palettes with five ocean palettes
  (deep sea, dawn, storm, lagoon, polar night), keeping the same
  `ThemeColors` contract so no component needs restructuring.
- **Iconography** — swap the neutral `symbols` set for nautical glyphs
  (anchor, helm, compass, swell spinner, wave dividers) chosen to render
  cleanly at single-cell width in a terminal.
- **Vocabulary** — reframe decorative labels with light maritime wording
  (heading, watch, wake, cast off) *without* renaming OpenSpec artifacts,
  whose names must stay faithful to the CLI.
- **Header & logo** — a horizon-line header with a helm/wave motif replacing
  the plain logo + model pill row.

## Scope

- Rewrite `src/tui/theme.tsx`: five marine themes + nautical `symbols`.
- Update the default theme to the deep-sea palette.
- Refresh `Header.tsx` (logo + horizon motif) and `StatusBar.tsx` labels.
- Apply the new spinner/dividers/bullets across `ThinkingPane`, `AgentSteps`,
  `ResultPane`, `PromptInput`, `CommandPalette`, `Timeline`.
- Update the theme picker in the command palette to list the marine themes.
- Update persisted-theme migration: old theme names fall back to a default.
- Update `README.md` theme list and any theme snapshot tests.

## Out of scope

- Layout / component-tree changes (zones and flexbox structure stay as-is).
- Renaming OpenSpec workflow steps or their artifacts.
- New keybindings or interaction models.
- Configurable / user-defined themes.

## Scope expansion

During implementation the change grew to cover related TUI and runtime work
delivered in the same effort, each captured as its own spec delta:

- **tui-scrolling** — independently scrollable thinking/response panes with a
  `Ctrl+T` focus toggle (replacing unreliable scroll ergonomics).
- **workflow-navigation** — `/<step>` slash commands (with autocompletion) to
  switch OpenSpec steps, replacing the unreliable `Alt+←/→` binding.
- **dmr-connection** — configurable `dmrScheme`/`dmrHost`/`dmrPort`.
- **model-reasoning** — reasoning off by default, toggleable and persisted.
- **skill-loading** — skills injected as a manifest and loaded on demand via a
  `read_skill` tool, shrinking the system prompt ~16×.

## Success criteria

- `bun run check` passes (typecheck + lint + tests).
- Every theme satisfies the `ThemeColors` contract and renders all zones.
- All five themes are cyclable from the command palette and persist.
- No component references a removed theme name or old symbol at build time.
- A stored theme name from the old set loads without crashing (falls back).
