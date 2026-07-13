# skill-loading Specification

## Purpose
TBD - created by archiving change marine-ui-redesign. Update Purpose after archive.
## Requirements
### Requirement: Skills injected as a manifest

The system prompt SHALL list available skills as a manifest of name plus
one-line description only, never their full `SKILL.md` bodies, so the prompt
stays small and cheap to re-evaluate each turn.

#### Scenario: Manifest excludes bodies

- **WHEN** the system prompt is built for a step
- **THEN** it contains each skill's name and description and an instruction to
  use the `read_skill` tool
- **AND** it does not contain the skills' full instruction bodies

### Requirement: On-demand skill loading

A `read_skill` tool SHALL return the full instructions for a skill by name so
the model can load them only when a task calls for it.

#### Scenario: Loading a known skill

- **WHEN** the model calls `read_skill` with a listed skill name
- **THEN** the tool returns that skill's full instructions

#### Scenario: Unknown skill name

- **WHEN** the model calls `read_skill` with a name that is not available
- **THEN** the tool returns an error listing the available skill names

