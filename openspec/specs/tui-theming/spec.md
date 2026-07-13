# tui-theming Specification

## Purpose
TBD - created by archiving change marine-ui-redesign. Update Purpose after archive.
## Requirements
### Requirement: Marine theme palette

The TUI SHALL ship a fixed set of five marine-themed color palettes —
`deep-sea`, `dawn`, `storm`, `lagoon`, `polar-night` — each fully
implementing the `ThemeColors` contract (`fg` and `bg` groups) so every visual
zone renders in every theme. `deep-sea` SHALL be the default (deep-sea, dark)
and `dawn` the default for light terminals.

#### Scenario: Every theme fills the contract

- **WHEN** the theme registry is loaded
- **THEN** exactly five themes are present with those names
- **AND** each theme defines every `fg.*` and `bg.*` key with a valid hex color

#### Scenario: Default is deep-sea

- **WHEN** paikea starts with no saved theme and a dark/unknown terminal
- **THEN** the active theme is `deep-sea`
- **AND** on a light terminal (COLORFGBG bg 7 or 15) the active theme is `dawn`

### Requirement: Marine iconography

The TUI SHALL use a nautical `symbols` set — anchor bullet, wave divider, `»`
heading arrow, swell spinner, helm gear — with every glyph rendering at a
single terminal-cell width so existing layouts stay aligned.

#### Scenario: Symbols are single-cell

- **WHEN** any component renders using `symbols`
- **THEN** the bullet, divider, arrow, spinner frame, and gear each occupy one
  cell and do not shift column alignment

### Requirement: Persisted-theme resilience

The TUI SHALL persist the active theme name to `~/.paikea/config.json` and,
when a stored name is not one of the five marine themes, SHALL fall back to
`deep-sea` without crashing.

#### Scenario: Unknown stored theme falls back

- **WHEN** the config holds a theme name removed in this redesign (e.g.
  `dracula`)
- **THEN** paikea loads the `deep-sea` default and continues normally

### Requirement: OpenSpec names preserved

The marine reframing SHALL apply only to decorative labels; OpenSpec workflow
step and artifact names (`Discuss`, `Proposal`, `Design`, `Specs`, `Tasks`,
`Apply`, `Archive`) SHALL remain unchanged so they stay faithful to the CLI.

#### Scenario: Workflow labels unchanged

- **WHEN** the frise/timeline renders the OpenSpec steps
- **THEN** the step names shown match the OpenSpec CLI names verbatim

