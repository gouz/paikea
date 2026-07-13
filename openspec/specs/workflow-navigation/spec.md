# workflow-navigation Specification

## Purpose
TBD - created by archiving change marine-ui-redesign. Update Purpose after archive.
## Requirements
### Requirement: Slash commands switch the workflow step

Typing a `/<step>` command and pressing Enter SHALL switch the active workflow
step instead of sending the text to the model. The commands are derived from
the steps currently shown in the frise.

#### Scenario: Switching step by command

- **WHEN** the user submits `/tasks` while the frise includes a Tasks step
- **THEN** the active step becomes Tasks, the input clears, and nothing is sent
  to the model

#### Scenario: Regular prompts are unaffected

- **WHEN** the user submits text that is not a step command
- **THEN** it is sent to the model as a normal prompt

### Requirement: Command resolution

A slash command SHALL resolve to a step by exact id, by the `propose` →
proposal alias, or by a unique prefix; ambiguous or unknown slash input is not
treated as a command.

#### Scenario: Alias and prefix

- **WHEN** the user submits `/propose` or `/ap`
- **THEN** the step switches to proposal and apply respectively

#### Scenario: Ambiguous prefix is not a command

- **WHEN** the user submits `/d` while both discuss and design steps exist
- **THEN** the step does not switch

### Requirement: Slash command autocompletion

While the prompt begins with `/`, the suggestion shown SHALL be the matching
step commands so the user can accept one with Tab instead of typing it in full.

#### Scenario: Completing a command

- **WHEN** the prompt is `/de` and only the design step matches
- **THEN** the suggestion completes to `/design` and Tab accepts it

