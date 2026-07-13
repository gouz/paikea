# TUI Architecture Spec

## Overview

Paikea's TUI is built on **Ink** (React for terminals) with **TermUI** components. It renders a full-screen terminal interface with 7 visual zones managed via flexbox layout.

## Stack

| Layer | Library |
|-------|---------|
| Component model | React 19 |
| Terminal renderer | Ink 7 |
| Components | TermUI 1.5 |
| Layout | Yoga (flexbox) |
| Runtime | Bun |

## Component Tree

```
App
├── Header          (fixed: logo + model + hints + frise)
├── Timeline        (fixed: OpenSpec step progress)
├── Box flexGrow=1  (scrollable content area)
│   ├── ThinkingPane   (conditional: chain-of-thought)
│   ├── AgentSteps     (conditional: tool calls/results)
│   └── ResultPane     (LLM response)
├── PromptInput     (fixed: text input + suggestions)
└── StatusBar       (fixed: tokens + toolbar)
```

## State

All state lives in `App.tsx` via `useState`:

```typescript
interface AppState {
  model: Model | null;
  models: Model[];
  messages: Message[];
  steps: Step[];
  thinking: ThinkingState;
  result: string;
  scrollOffset: number;
  thinkingVisible: boolean;
  streaming: boolean;
  agentSteps: AgentStep[];
  uiMode: "normal" | "palette" | "toolbar";
  toolbarIndex: number;
  paletteIndex: number;
  suggestions: string[];
  suggestionIndex: number;
}
```

## Keyboard Modes

| Mode | Trigger | Keys |
|------|---------|------|
| Normal | default | typing, Enter, Tab, Esc, arrows |
| Toolbar | ↑ | Tab cycles, Enter executes, Esc/↓ exits |
| Palette | `:` | ↑↓ navigate, Enter executes, Esc exits |

## Agent Loop

Async function in `App.tsx`:
1. Build messages array with system prompt
2. Stream LLM response via `streamChat()`
3. If tool calls returned → execute → append results → loop (max 10 iterations)
4. If text only → display in ResultPane
5. Save session to `.paikea/sessions/`

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `index.tsx` | 8 | Ink render entry |
| `App.tsx` | ~650 | State + keyboard + agent loop |
| `theme.tsx` | ~55 | Colors, symbols, frise |
| `components/Header.tsx` | ~45 | Top bar |
| `components/Timeline.tsx` | ~40 | Step progress |
| `components/ThinkingPane.tsx` | ~30 | Thinking display |
| `components/AgentSteps.tsx` | ~95 | Tool visualization |
| `components/ResultPane.tsx` | ~85 | LLM response |
| `components/PromptInput.tsx` | ~65 | Input area |
| `components/StatusBar.tsx` | ~55 | Bottom bar |
| `components/CommandPalette.tsx` | ~45 | Action overlay |
