# Tasks: Migrate TUI to Ink + TermUI

## Phase 1: Setup

- [x] Install dependencies: `ink`, `react`, `@types/react`, `termui`
- [x] Create `src/tui/` directory structure
- [x] Create `src/tui/index.tsx` — Ink render entry point
- [x] Update `src/cli/commands/run.ts` — import from `src/tui/` instead of `tui-main`

## Phase 2: Theme

- [x] Create `src/tui/theme.tsx` — colors, symbols, frise palette
- [x] Map all `@hexie/tui` Color types to plain hex strings

## Phase 3: Layout Components

- [x] Create `Header.tsx` — logo 🏄, model pill, keyboard hints, frise
- [x] Create `Timeline.tsx` — OpenSpec step progress with flexbox
- [x] Create `StatusBar.tsx` — tokens, toolbar buttons, streaming indicator

## Phase 4: Content Components

- [x] Create `ThinkingPane.tsx` — chain-of-thought with border
- [x] Create `AgentSteps.tsx` — tool calls/results with icons
- [x] Create `ResultPane.tsx` — LLM response with markdown-like styling

## Phase 5: Input & Overlays

- [x] Create `PromptInput.tsx` — text input with ghost suggestions
- [x] Create `CommandPalette.tsx` — action palette overlay

## Phase 6: Main App

- [x] Create `App.tsx` — all state via useState/useReducer
- [x] Implement `useInput()` keyboard handler (palette, toolbar, normal modes)
- [x] Migrate `runAgentLoop()` — setState instead of store.set + drawUI
- [x] Migrate `handleSubmit()` — message management, session save

## Phase 7: Cleanup

- [x] Delete `src/renderer/` (terminal.ts, draw.ts, layout.ts, input-decoder.ts, theme.ts)
- [x] Delete `src/components/` (8 files)
- [x] Delete `src/state/store.ts`
- [x] Delete `src/cli/commands/tui-main.ts`
- [x] Remove `@hexie/tui` from package.json
- [x] Delete obsolete tests (store.test.ts, layout.test.ts, input-decoder.test.ts)
- [x] Update README.md architecture section

## Phase 8: Validation

- [x] Fix type errors in new TUI files
- [x] Fix pre-existing type error in openspec-hook.ts (`as const` → `as Step["status"]`)
- [x] Lint passes (0 errors)
- [x] Typecheck passes (0 errors)
- [x] Tests pass (25/25)
