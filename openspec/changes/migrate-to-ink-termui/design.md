# Design: Migrate TUI to Ink + TermUI

## Architecture Change

```
BEFORE (imperative)                    AFTER (React/JSX)
─────────────────                     ─────────────────
terminal.ts (164L)                    render(<App />)  — 1 line
store.ts (98L)                        useState/useReducer
layout.ts (81L)                       <Box flexDirection="column"> (flexbox)
draw.ts (138L)                        <Box borderStyle="round"> + <Text>
input-decoder.ts (248L)               useInput() hook
8 composants .ts → renderXxx(term)    8 composants .tsx → fonctions React
tui-main.ts (708L)                    App.tsx + hooks
```

## New File Structure

```
src/tui/
├── index.tsx                 # Ink render entry point
├── App.tsx                   # Main component: state, keyboard, agent loop
├── theme.tsx                 # Colors, symbols, frise palette
└── components/
    ├── Header.tsx            # 🏄 paikea + model pill + hints
    ├── Timeline.tsx          # OpenSpec step progress bar
    ├── ThinkingPane.tsx      # Chain-of-thought display
    ├── AgentSteps.tsx        # Tool call/result visualization
    ├── ResultPane.tsx        # LLM response with markdown styling
    ├── PromptInput.tsx       # Text input with ghost suggestions
    ├── StatusBar.tsx         # Tokens, toolbar buttons, streaming
    └── CommandPalette.tsx    # Action palette overlay
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `ink` | React renderer for terminals |
| `react` | Component model |
| `@types/react` | TypeScript types |
| `termui` | 101+ components, themes, hooks |

## State Management

Replace custom `Store` class with React state in `App.tsx`:

```tsx
const [state, setState] = useState<AppState>({...});
```

All `store.set()` calls become `setState()` calls. The `drawUI()` function is eliminated — React re-renders automatically on state changes.

## Keyboard Handling

Replace 248-line custom input decoder with Ink's `useInput()` hook:

```tsx
useInput((input, key) => {
  if (key.escape) quit();
  if (key.return) handleSubmit();
  if (key.tab && key.shift) prevModel();
  // ...
});
```

## Layout

Replace manual 7-zone layout calculation with flexbox:

```tsx
<Box flexDirection="column" height="100%">
  <Header />
  <Timeline />
  <Box flexGrow={1}>
    <ThinkingPane />
    <AgentSteps />
    <ResultPane />
  </Box>
  <PromptInput />
  <StatusBar />
</Box>
```

## Agent Loop

The `runAgentLoop()` function remains async but triggers `setState()` instead of `store.set()` + `drawUI()`. React handles re-rendering.

## Deleted Files

| File | Reason |
|------|--------|
| `src/renderer/terminal.ts` | Ink manages terminal lifecycle |
| `src/renderer/draw.ts` | `<Box>`, `<Text>` primitives |
| `src/renderer/layout.ts` | Flexbox via Yoga |
| `src/renderer/input-decoder.ts` | `useInput()` hook |
| `src/renderer/theme.ts` | Replaced by `src/tui/theme.tsx` |
| `src/state/store.ts` | React state |
| `src/components/*.ts` | Replaced by `src/tui/components/*.tsx` |
| `src/cli/commands/tui-main.ts` | Replaced by `src/tui/App.tsx` |
