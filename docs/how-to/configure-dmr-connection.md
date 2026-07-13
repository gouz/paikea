# Configure the DMR connection

By default paikea connects to Docker Model Runner at
`http://localhost:12434/engines/v1`. To reach a runner on another scheme, host,
or port, set the connection fields in `~/.paikea/config.json`.

## Point at a remote runner

Edit `~/.paikea/config.json` (create it if it does not exist):

```json
{
  "dmrScheme": "https",
  "dmrHost": "dmr.example.com",
  "dmrPort": 443
}
```

Restart paikea. Requests now go to
`https://dmr.example.com:443/engines/v1`.

## Change only the port

You only need the fields you want to override — the rest keep their defaults:

```json
{
  "dmrPort": 8080
}
```

This connects to `http://localhost:8080/engines/v1`.

## Rules and fallbacks

- `dmrScheme` — only `https` overrides the default; anything else stays `http`.
- `dmrHost` — a hostname or IP with **no scheme**; a blank value falls back to
  `localhost`.
- `dmrPort` — an integer in `1..65535`; out-of-range or non-integer values fall
  back to `12434`.

If a value is malformed paikea silently uses the default rather than failing, so
a bad edit degrades to the local runner instead of breaking startup.

## Verify it worked

Start paikea. If the model pill in the masthead shows a model name, the
connection succeeded. If you see "No models found in Docker Model Runner",
paikea reached nothing at that address — re-check the scheme/host/port and that
the runner is up.

See also: [Configuration file](../reference/configuration.md).
