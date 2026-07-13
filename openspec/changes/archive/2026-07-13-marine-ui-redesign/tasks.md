# Tasks: Marine UI Redesign

## Phase 1: Themes

- [x] Replace the `themes` array in `src/tui/theme.tsx` with the five marine
      palettes (`deep-sea`, `dawn`, `storm`, `lagoon`, `polar-night`)
- [x] Set `deep-sea` first so `currentThemeIndex = 0` defaults to it
- [x] Update the hardcoded fallback palettes in `getCurrentTheme()` and `t()`
      to the `deep-sea` values
- [x] Update `detectDefaultTheme()` in `src/state/config.ts` → `"dawn"` for
      light terminals, `"deep-sea"` otherwise

## Phase 2: Iconography

- [x] Replace the `symbols` export with the nautical set (anchor bullet, wave
      divider, `»` arrow, swell spinner, helm gear)
- [x] Verify each consumer of `symbols` still aligns (single-cell width)
- [x] Sanity-check the swell spinner animation in `use-spinner.ts`

## Phase 3: Header & logo

- [x] Update `Header.tsx` logo to `⚓ paikea`
- [x] Add the horizon rule (1-cell tinted `bg.panelAlt` separator under the row)
- [x] Confirm model pill + frise/hints keep their positions

## Phase 4: Vocabulary

- [x] StatusBar labels: current step → "cap", group session/tokens under "quart"
- [x] PromptInput placeholder → "cast off — type to set a course…"
- [x] Empty result state → "calm seas — awaiting orders"
- [x] Leave all OpenSpec step/artifact names unchanged

## Phase 5: Command palette

- [x] Confirm the theme picker lists the five marine themes (driven by
      `getThemeNames()`, should be automatic)
- [x] Verify cycle + persistence round-trips through `~/.paikea/config.json`

## Phase 6: Docs & tests

- [x] Update `README.md` theme list
- [x] Update `registries.test.ts` / theme snapshots for the new names
- [x] Add a test: stored unknown theme name falls back to `deep-sea`
- [x] `bun run check` passes (typecheck + lint + test)

## Phase 7: Verify

- [x] Run the TUI, cycle all five themes, confirm every zone renders
- [x] Check glyphs render on the default terminal (anchor, helm, `»`, swell)
