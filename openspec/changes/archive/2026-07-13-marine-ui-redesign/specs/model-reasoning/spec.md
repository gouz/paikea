# Model Reasoning

## ADDED Requirements

### Requirement: Reasoning off by default

Model chain-of-thought SHALL be disabled by default and enabled only when
`thinking` is `true` in `~/.paikea/config.json`. The default favours faster,
direct responses.

#### Scenario: Absent config disables reasoning

- **WHEN** no `thinking` field is set
- **THEN** thinking is treated as disabled

#### Scenario: Explicit enable

- **WHEN** `thinking` is `true`
- **THEN** thinking is enabled

### Requirement: Reasoning is toggleable and persisted

The command palette SHALL expose a toggle for model thinking that persists the
choice to the config, distinct from the toggle that only hides the thinking
pane.

#### Scenario: Toggle persists

- **WHEN** the user toggles "Model Thinking" in the palette
- **THEN** the new value is written to `~/.paikea/config.json` and applied to
  the next turn

### Requirement: Disabling reasoning suppresses chain-of-thought

When reasoning is disabled for a thinking-capable model, the client SHALL send
`chat_template_kwargs.enable_thinking = false` so the model emits no reasoning.

#### Scenario: No reasoning produced

- **WHEN** thinking is disabled and a thinking-capable model answers a prompt
- **THEN** no thinking pane appears and the response is produced directly
