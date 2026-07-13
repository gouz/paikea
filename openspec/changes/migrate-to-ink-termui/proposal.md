# Migrate TUI from @hexie/tui to Ink + TermUI

## Problem

Paikea's TUI is built on `@hexie/tui`, a minimal cell-based rendering library. Every component manually calculates row/col positions, draws boxes character by character, and manages its own ANSI input decoder. This imperative approach leads to:

- ~1500 lines of boilerplate for layout, drawing, and input handling
- No flexbox — manual 7-zone layout calculation
- Custom ANSI/VT input decoder (248 lines) because @hexie/tui only supports Kitty keyboard protocol
- Custom reactive state store (98 lines) instead of using React's built-in state
- No access to a rich component ecosystem (tables, spinners, modals, etc.)

## Solution

Replace `@hexie/tui` with **Ink** (React for terminals) + **TermUI** (101+ components, themes, hooks). This shifts the architecture from imperative cell rendering to declarative React components with flexbox layout.

## Scope

- Rewrite all 8 TUI components as React/TSX composants
- Replace manual layout with Ink's flexbox (Yoga engine)
- Replace custom input decoder with Ink's `useInput()` hook
- Replace custom state store with React `useState`/`useReducer`
- Replace manual terminal lifecycle with Ink's `render()`
- Keep all services, tools, skills, rules, types unchanged

## Out of scope

- Migrating to OpenTUI (Zig native) — deferred to future
- Changing the agent loop logic
- Modifying the LLM streaming protocol
