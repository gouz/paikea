# Configuration file

paikea reads `~/.paikea/config.json`. The file is created and updated
automatically when you change settings from the command palette, and can be
edited by hand. All fields are optional.

```json
{
  "theme": "deep-sea",
  "dmrScheme": "http",
  "dmrHost": "localhost",
  "dmrPort": 12434,
  "thinking": false
}
```

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | string | terminal-detected | Active theme. One of `deep-sea`, `dawn`, `storm`, `lagoon`, `polar-night`. Unknown names fall back to `deep-sea`. |
| `dmrScheme` | string | `http` | Scheme of the DMR API. Only `https` overrides the default. |
| `dmrHost` | string | `localhost` | Host of the DMR API (hostname or IP, no scheme). Blank falls back to the default. |
| `dmrPort` | number | `12434` | Port of the DMR API. Must be an integer in `1..65535`; otherwise falls back to the default. |
| `thinking` | boolean | `false` | Whether thinking-capable models reason before answering. `true` enables chain-of-thought. |

## Default theme detection

When `theme` is absent, paikea inspects the `COLORFGBG` environment variable. A
background index of `7` or `15` (light terminal) selects `dawn`; anything else
selects `deep-sea`.

## Connection base URL

`dmrScheme`, `dmrHost`, and `dmrPort` combine into
`<scheme>://<host>:<port>/engines/v1`. Each is resolved independently, so an
invalid value for one does not affect the others.

## Related files

| Path | Purpose |
|------|---------|
| `~/.paikea/config.json` | This configuration file |
| `~/.paikea/sessions/` | Saved conversation history |
| `~/.config/paikea/tools/` | User-global custom tools (`*.tool.json`) |
| `.paikea/skills/`, `.claude/skills/` | Project skill overrides |
| `.paikea/tools/` | Project custom tools (override bundled + user) |
