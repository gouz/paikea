# tui-scrolling Specification

## Purpose
TBD - created by archiving change marine-ui-redesign. Update Purpose after archive.
## Requirements
### Requirement: Independently scrollable panes

The thinking pane and the response pane SHALL each be independently
scrollable. A scroll offset counts from the bottom, where `0` follows the
latest output (the tail).

#### Scenario: Response scrolls without moving thinking

- **WHEN** the response pane is focused and the user scrolls up
- **THEN** the response shows earlier lines with a position indicator
  (`start–end/total`)
- **AND** the thinking pane keeps its own separate scroll position

#### Scenario: New prompt re-anchors to the tail

- **WHEN** the user submits a new prompt
- **THEN** both panes' scroll offsets reset to `0` and focus returns to the
  response pane

### Requirement: Scroll acts on the focused pane

Scroll keys SHALL apply to whichever pane holds scroll focus: `↑`/`↓` move one
line, and `PageUp`/`PageDown` and `Shift+↑`/`Shift+↓` move five lines.

#### Scenario: Line and page scrolling

- **WHEN** the focused pane overflows and the user presses `↑` then `PageUp`
- **THEN** the pane scrolls up one line, then five more lines

### Requirement: Scroll focus toggle

`Ctrl+T` SHALL toggle scroll focus between the thinking and response panes,
but only while the thinking pane is on screen. The focused pane's border is
rendered in the accent color.

#### Scenario: Toggling focus to thinking

- **WHEN** the thinking pane is visible and the user presses `Ctrl+T`
- **THEN** scroll focus moves to the thinking pane and its border is accented
- **AND** subsequent scroll keys move the thinking pane

