# Design: Marine UI Redesign

## Principle

The `ThemeColors` contract and component tree stay **untouched**. The redesign
is a content swap — palettes, glyphs, labels — behind the existing interfaces,
so risk is confined to `theme.tsx` and a handful of label strings. Every marine
theme fills the exact same `fg`/`bg` keys the components already consume.

## Themes

Five palettes replace the current six. Names are lowercase kebab (they are
persisted verbatim to `~/.paikea/config.json`).

| name | mood | base | notes |
|------|------|------|-------|
| `deep-sea` | deep open sea (default, dark) | abyssal navy | aqua accent, foam text |
| `dawn` | dawn over water (light) | pale sand/foam | sea-blue accent |
| `storm` | storm at sea (dark) | slate/graphite | lighthouse-amber warning |
| `lagoon` | tropical lagoon (dark) | deep teal | turquoise accent, coral error |
| `polar-night` | polar night (dark) | ice-navy | pale ice-blue accent |

Semantic mapping kept consistent across themes: `accent` = sea/sky blue-teal,
`success` = seaweed/algae green, `warning` = lighthouse/beacon amber,
`error` = coral/distress red, `thinking` = bioluminescence violet.

### Palettes (hex)

```
deep-sea (default, dark)
  fg: primary #dceefb  secondary #7fa8c9  dim #3d5a73  accent #4dd0e1
      success #6fcf97  warning #f2c14e  error #ff6b6b  thinking #9d8cf0  muted #567a94
  bg: header #061620  panel #0a2230  panelAlt #0e2c3d  status #061620
      input #0a2230  thinking #0c1e2e

dawn (light)
  fg: primary #123047  secondary #4a708c  dim #9db8c9  accent #0277bd
      success #2e8b57  warning #b8860b  error #c0392b  thinking #5b4b9c  muted #6d8ba0
  bg: header #eef4f2  panel #e3ecec  panelAlt #d6e3e3  status #eef4f2
      input #e3ecec  thinking #e8eef2

storm (dark)
  fg: primary #e6ebef  secondary #8b9caa  dim #4a5a68  accent #7fb3c9
      success #7fb891  warning #f4a259  error #e85d5d  thinking #b0a4d4  muted #6b7b89
  bg: header #12181d  panel #1b242c  panelAlt #232f39  status #12181d
      input #1b242c  thinking #18222b

lagoon (dark)
  fg: primary #e0f7f4  secondary #6fb3ab  dim #2f5f5a  accent #26c6da
      success #4dd6a0  warning #ffd166  error #ff7a6b  thinking #b088e0  muted #4f8a83
  bg: header #041c1f  panel #06282b  panelAlt #093437  status #041c1f
      input #06282b  thinking #08262a

polar-night (dark)
  fg: primary #eaf1f8  secondary #7d97b3  dim #3b4d63  accent #7fb0d4
      success #8fc0a9  warning #e8c37e  error #e07a8a  thinking #a99cd6  muted #63788f
  bg: header #0a0f18  panel #10161f  panelAlt #161e2a  status #0a0f18
      input #10161f  thinking #0e1521
```

## Symbols

Replace the neutral `symbols` set with nautical glyphs. All chosen to be
single terminal cell width (no wide/emoji glyphs inside `symbols`, to keep
alignment predictable — emoji stays only in the header logo).

```ts
export const symbols = {
  bullet: "⚓",     // anchor — active/marker
  empty: "○",       // buoy ring — inactive
  divider: "~",     // wave — inline separator (was "·")
  dot: "◦",         // small buoy
  arrow: "»",       // course/heading (was "→")
  spinner: ["▁","▂","▃","▄","▅","▆","▇","▆","▅","▄","▃","▂"], // swell
  check: "✓",       // kept (universal)
  cross: "✗",       // kept
  gear: "⎈",        // helm wheel (was "⚙")
};
```

`arrow` is used in prompt/agent-step framing; verify no layout assumes a
specific width before swapping (all are 1-cell). If the swell spinner reads
poorly in narrow terminals, fall back to a horizon sweep
`["◜","◠","◝","◞","◡","◟"]`.

## Vocabulary

Light maritime reframing of **decorative** labels only. OpenSpec artifact and
step names (`Discuss`, `Proposal`, `Design`, `Specs`, `Tasks`, `Apply`,
`Archive`) are **not** renamed — they mirror the CLI and must stay legible.

| location | current | marine |
|----------|---------|--------|
| Header logo | `🏄 paikea` | `⚓ paikea` (keep 🏄 wave-rider optional) |
| StatusBar: current step hint | "step" | "cap" (heading) |
| StatusBar: session/tokens | "tokens" | keep "tokens"; group under "quart" (watch) label |
| Prompt placeholder | existing | "cast off — type to set a course…" |
| Empty result state | existing | "calm seas — awaiting orders" |

Wording is suggestive, not exhaustive; keep it subtle so clarity wins. Any
label that names a function the user must recognise stays literal.

## Header motif

`Header.tsx` currently renders `🏄 paikea` + model pill + hints on one row.
New layout: logo (`⚓ paikea`) on the left, model pill on the right, and a thin
**horizon line** (`background`-tinted rule using `bg.panelAlt`) under the row to
evoke the sea/sky boundary. No new components — a single extra `Box` with a
1-cell-tall tinted separator. Keep the frise/hints exactly where they are.

## Default theme

`detectDefaultTheme()` in `src/state/config.ts` returns `"dark"`/`"light"`,
neither of which will exist. Update it to return `"dawn"` for light terminals
(COLORFGBG bg 7/15) and `"deep-sea"` otherwise.

## Migration of persisted theme

No explicit migration code needed: `setThemeByName(name)` returns `null` and
leaves `currentThemeIndex` at `0` when the stored name is unknown, so a config
holding a removed name (`dracula`, etc.) silently loads the `deep-sea`
default. Add a test asserting this fallback. `App.tsx` already ignores the
return value, which is the desired behaviour.

## Files touched

- `src/tui/theme.tsx` — themes array + `symbols` + hardcoded fallbacks in
  `getCurrentTheme`/`t()` updated to the `deep-sea` palette.
- `src/state/config.ts` — `detectDefaultTheme()` return values.
- `src/tui/components/Header.tsx` — logo + horizon rule.
- `src/tui/components/StatusBar.tsx` — labels.
- `src/tui/components/PromptInput.tsx` — placeholder, arrow/divider usage.
- `src/tui/components/{ThinkingPane,AgentSteps,ResultPane,CommandPalette,Timeline}.tsx`
  — pick up new symbols (mostly automatic via `symbols` import).
- `README.md` — theme list under Features / shortcuts.
- Tests — `registries.test.ts` / any theme snapshot + a new fallback test.

## Risks

- **Terminal glyph support**: `⚓ ⎈ »` are BMP and widely supported; the swell
  spinner uses block elements (universal). Emoji logo may render double-width
  on some terminals — the header tolerates it (left-aligned, flexible).
- **Contrast/accessibility**: verify `dim`/`secondary` on their `bg` stay
  legible; the palettes above target WCAG-ish contrast for `primary` on `bg`.
- **Hardcoded fallbacks**: `theme.tsx` duplicates the default palette twice in
  fallbacks — both must be updated or a fallback path shows the old colors.
