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

- **Project structure** — `src/`, `package.json`, `README.md`, `.gitignore`
- **Devcontainer** — Dockerfile, docker-compose.yml, devcontainer.json
- **OpenSpec** — `openspec/changes/` and `openspec/specs/`
- **Obsidian vault** — `.paikea/vault/` (see below)
- **Skills** — `.paikea/skills/`: obsidian-cli, openspec-git, conventional-commits…
- **Rules** — `.paikea/rules/`: obsidian link conventions, devcontainer…
- **AGENTS.md** — workflow rules and vault conventions
- **Docs** — a Diátaxis documentation scaffold under `docs/`
- **Git repository** — runs `git init` on branch `main` and makes an initial
  commit of everything scaffolded above (skipped if the directory is already a
  repo)

### The Obsidian vault

`paikea init` scaffolds an [Obsidian](https://obsidian.md)-openable vault at
`.paikea/vault/`. It is paikea's own knowledge store — session logs, skill and
spec docs — kept as plain markdown so you can browse and link it in Obsidian
(graph view, backlinks, tags):

| Path | Contents |
|------|----------|
| `index.md` | Vault landing note describing the structure |
| `logs/` | Session logs |
| `skills/` | Skill documentation |
| `rules/` | Project rules |
| `specs/` | OpenSpec specifications, synced from `openspec/` |
| `templates/` | `session-log.md`, `skill-doc.md`, `spec-doc.md` |

Open it directly with Obsidian:

```bash
obsidian .paikea/vault
```

The broader thought-journal conventions the agent follows inside a vault
(`Context/`, `Daily/`, `Intelligence/`, `Resources/`, wiki-links, frontmatter)
are documented in the generated `AGENTS.md`.

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
