# dmr-connection Specification

## Purpose
TBD - created by archiving change marine-ui-redesign. Update Purpose after archive.
## Requirements
### Requirement: Configurable connection endpoint

The Docker Model Runner base URL SHALL be built from `dmrScheme`, `dmrHost`
and `dmrPort` in `~/.paikea/config.json`, forming
`<scheme>://<host>:<port>/engines/v1`. All three are optional.

#### Scenario: Full override

- **WHEN** the config sets `dmrScheme` `https`, `dmrHost` `dmr.example.com`,
  `dmrPort` `443`
- **THEN** requests target `https://dmr.example.com:443/engines/v1`

#### Scenario: Defaults when absent

- **WHEN** none of the three fields is set
- **THEN** requests target `http://localhost:12434/engines/v1`

### Requirement: Invalid values fall back

Each connection field SHALL fall back to its default when the configured value
is unusable: only `https` overrides the `http` scheme, a blank host falls back
to `localhost`, and a port that is not an integer in `1..65535` falls back to
`12434`.

#### Scenario: Bad values ignored

- **WHEN** the config sets `dmrScheme` `ftp`, a blank `dmrHost`, and
  `dmrPort` `0`
- **THEN** requests target `http://localhost:12434/engines/v1`

