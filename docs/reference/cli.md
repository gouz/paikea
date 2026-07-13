# CLI commands

paikea is a single binary. In development, replace `paikea` with `bun run dev`.

## `paikea`

Launch the full-screen interactive TUI. This is the default command.

```bash
paikea
```

Requires Docker Model Runner to be running with at least one model pulled.

## `paikea init`

Scaffold a new project directory with a full paikea/OpenSpec dev environment.

```bash
paikea init
```

Creates:

- **Devcontainer** — Dockerfile, docker-compose.yml, devcontainer.json
- **OpenSpec** — `openspec/changes/` and `openspec/specs/`
- **Vault** — `Context/`, `Daily/`, `Intelligence/`, `Resources/` for Obsidian
- **Skills** — obsidian-cli, obsidian-markdown, defuddle, openspec-\*, json-canvas
- **Rules** — TypeScript strict, conventional commits, devcontainer, testing…
- **AGENTS.md** — workflow rules and vault conventions
- **Docs** — a Diátaxis documentation scaffold

## `paikea doc`

Generate Diátaxis documentation for the current project.

```bash
paikea doc                 # generate into ./docs
paikea doc -o ./my-docs    # custom output directory
paikea doc -s src          # scope the scan to src/ only
```

| Flag | Description |
|------|-------------|
| `-o <dir>` | Output directory (default `./docs`) |
| `-s <dir>` | Restrict source scanning to this directory |

The output is organized into `tutorials/`, `how-to/`, `reference/`, and
`explanation/`, with an `index.md` and `_Sidebar.md`.
