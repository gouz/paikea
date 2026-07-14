# 🏄 Paikea

A full-screen TUI CLI agent powered by local LLMs via [Docker Model Runner](https://docs.docker.com/desktop/features/model-runner/).

```
paikea
```

> **The name.** In Māori tradition, [Paikea](https://en.wikipedia.org/wiki/Paikea)
> is the whale rider — an ancestor who, thrown into the ocean, survived by riding
> a whale to shore. The name sets the tone for the whole tool: an ocean voyage
> you steer, hence the 🏄 masthead, the marine themes, and the nautical
> vocabulary throughout ("cast off", "calm seas", the workflow *frise*).

## Documentation

Full docs live in [`docs/`](docs/index.md), organized with the
[Diátaxis](https://diataxis.fr) framework:

- **[Tutorial — Getting started](docs/tutorials/getting-started.md)**
- **How-to** — [connection](docs/how-to/configure-dmr-connection.md) ·
  [speed](docs/how-to/speed-up-responses.md) ·
  [workflow](docs/how-to/drive-the-workflow.md) ·
  [appearance](docs/how-to/customize-appearance.md)
- **Reference** — [configuration](docs/reference/configuration.md) ·
  [keybindings](docs/reference/keybindings.md) ·
  [CLI](docs/reference/cli.md) · [tools](docs/reference/tools.md)
- **Explanation** — [architecture](docs/explanation/architecture.md) ·
  [workflow frise](docs/explanation/workflow-frise.md) ·
  [speed & context](docs/explanation/speed-and-context.md)

## Features

- **Full-screen TUI** — React/Ink components with flexbox layout
- **Local LLMs** — streams via Docker Model Runner (OpenAI-compatible API at `localhost:12434`)
- **Model switching** — Tab / Shift+Tab cycles through available models, or `M` to pick from a list
- **Marine themes** — five ocean palettes (`deep-sea`, `dawn`, `storm`, `lagoon`, `polar-night`) with nautical iconography, switchable from the command palette
- **Thinking support** — detects and renders chain-of-thought from Qwen3, DeepSeek-R1, OpenAI o-series
- **Markdown rendering** — responses render inline emphasis (**bold**, *italic*, `code`) as well as headings, bullets, and code blocks, while leaving fenced code untouched
- **OpenSpec integration** — detects discuss → proposal → design → specs → tasks → apply → archive workflow
- **Git workflow** — the `openspec-git` skill ties git to the lifecycle: a `feat/<name>` branch on proposal, a commit per finished task, and a merge into `main` on archive
- **Skills & rules** — loads from bundled defaults + `.paikea/` + `.claude/` project overrides
- **Session persistence** — saves conversation history to `.paikea/sessions/`
- **Project scaffolding** — `paikea init` creates a full dev environment with a git repo, devcontainer, OpenSpec, an Obsidian vault, and Diátaxis docs
- **Diátaxis docs** — `paikea doc` generates tutorials, how-to, reference, and explanation documentation
- **Single binary** — compiles to a self-contained executable via `bun build --compile`

## Configuration

paikea reads `~/.paikea/config.json`. All fields are optional:

```json
{
  "theme": "deep-sea",
  "dmrScheme": "http",
  "dmrHost": "localhost",
  "dmrPort": 12434,
  "thinking": false
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `theme` | terminal-detected | Active marine theme (see below) |
| `dmrScheme` | `http` | Scheme of the Docker Model Runner API. Only `https` overrides the default. |
| `dmrHost` | `localhost` | Host of the DMR API (hostname or IP, no scheme). A blank value falls back to the default. |
| `dmrPort` | `12434` | Port of the DMR API. An out-of-range or non-integer value falls back to the default. |
| `thinking` | `false` | Whether thinking-capable models reason before answering. Left off for faster, direct responses; set `true` (or toggle from `Ctrl+P`) to re-enable chain-of-thought. |

The scheme/host/port form the base URL `<scheme>://<host>:<port>/engines/v1` — point paikea at a remote or containerised runner by setting these.

### Speed & context

Responses are gated by two things on small local models: prompt-eval time
(how many tokens the model must read every turn) and the model's context
window. paikea keeps the system prompt small — skill instructions are loaded
on demand via the `read_skill` tool rather than injected in full — and leaves
model reasoning off by default (`thinking: false`). The context window itself
is fixed when Docker Model Runner loads the model; raise it with:

```bash
docker model configure <model> --context-size 16384
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Model Runner enabled
- At least one model pulled (e.g. `ai/qwen3`)
- [Bun](https://bun.sh) (v1.3+) — only to build from source (not needed for the Homebrew install)
- _(optional)_ [OpenSpec](https://github.com/Fission-AI/OpenSpec) CLI — `npm i -g @fission-ai/openspec` — to drive the workflow frise. Without it, paikea runs as a plain chat with a single **Discuss** step.

## Install

### Homebrew (recommended)

```bash
brew install gouz/tools/paikea
```

This installs the prebuilt `paikea` binary and puts it on your `PATH`. Upgrade
later with `brew upgrade gouz/tools/paikea`.

### From source

```bash
bun install          # install dependencies
bun run build        # compile to dist/paikea
```

## Development

```bash
bun run dev          # run in development mode
bun run build        # compile to dist/paikea
bun run check        # typecheck + lint + test
bun run lint         # biome check
bun run lint:fix     # biome check --write
bun run format       # biome format --write
bun run test         # run tests
```

## Usage

### Interactive TUI

```bash
paikea
```

#### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Submit prompt |
| `Escape` | Cancel generation (while streaming) · Quit (when idle) |
| `Ctrl+C` / `Ctrl+D` | Cancel generation, or quit |
| `Tab` | Accept suggestion, or next model when there is none |
| `Shift+Tab` | Previous model |
| `Ctrl+P` | Open command palette (models, themes, steps…) |
| `/discuss`, `/proposal`, `/design`, `/specs`, `/tasks`, `/apply`, `/archive` | Switch OpenSpec step — type the command (Tab autocompletes) and press Enter. A unique prefix works too (`/pro` → proposal). |
| `Alt+←`/`Alt+→` | Previous / next OpenSpec step (if your terminal forwards Alt+arrows) |
| `←/→` | Move cursor in prompt |
| `Home`/`End` · `Ctrl+A`/`Ctrl+E` | Jump to start/end of prompt |
| `Ctrl+W` / `Ctrl+U` | Delete previous word / to line start |
| `↑`/`↓` · `PageUp`/`PageDown` · `Shift+↑`/`Shift+↓` | Scroll the focused pane (anchored to the latest output) |
| `Ctrl+T` | Switch scroll focus between the thinking and response panes |

The workflow frise is read from the OpenSpec CLI: **Discuss** (a free-form
step that never touches OpenSpec) followed by the active change's real
artifacts (`Proposal → Design → Specs → Tasks`, from `openspec status`), then
`Apply` (task implementation progress) and `Archive`. paikea tracks the most
recently modified in-progress change; if the CLI isn't installed or the repo
isn't an OpenSpec project, only the **Discuss** step is shown.

The selected step drives the session: prompt suggestions, the step-matching
`openspec-*` skills injected into the system prompt, and step-specific
guidance (`openspec new change`, `openspec validate`, `openspec archive`…). It
defaults to the current step and refreshes after each turn.

### Initialize a project

```bash
paikea init
```

Creates a new directory with:
- **Project structure** — `src/`, `package.json`, `README.md`, `.gitignore`
- **Devcontainer** — Dockerfile + docker-compose.yml + devcontainer.json
- **OpenSpec** — `openspec/changes/`, `openspec/specs/` directories
- **Obsidian vault** — `.paikea/vault/` with `index.md` + `logs/`, `skills/`, `rules/`, `specs/`, `templates/`, openable with `obsidian .paikea/vault`
- **Skills** — `.paikea/skills/`: obsidian-cli, openspec-git, conventional-commits…
- **Rules** — `.paikea/rules/`: obsidian link conventions, devcontainer…
- **AGENTS.md** — workflow rules and vault conventions
- **Docs** — Diátaxis documentation scaffold under `docs/`
- **Git repository** — `git init` on branch `main` + an initial commit of the scaffold (skipped if already a repo)

See [CLI reference — `paikea init`](docs/reference/cli.md) for the full vault layout.

### Generate documentation

```bash
paikea doc                    # generate docs in ./docs
paikea doc -o ./my-docs       # custom output directory
paikea doc -s src             # scope to src/ only
```

## Architecture

```
src/
├── cli/
│   ├── index.ts              # CLI entry (clipse)
│   ├── commands/
│   │   ├── init.ts           # paikea init
│   │   ├── doc.ts            # paikea doc
│   │   └── run.ts            # paikea (TUI)
│   └── prompts/
│       └── stack-questions.ts # init wizard (language, framework, db, services)
├── tui/
│   ├── index.tsx             # TUI entry (Ink render)
│   ├── App.tsx               # Main app component + agent loop
│   ├── theme.tsx             # colors, symbols, frise palette
│   └── components/
│       ├── Header.tsx        # top bar with logo + model pill
│       ├── Timeline.tsx      # OpenSpec step progress
│       ├── ThinkingPane.tsx  # chain-of-thought display
│       ├── AgentSteps.tsx    # tool call/result visualization
│       ├── ResultPane.tsx    # LLM response rendering
│       ├── PromptInput.tsx   # text input with suggestions
│       ├── StatusBar.tsx     # bottom bar (tokens, toolbar)
│       └── CommandPalette.tsx # action palette overlay
├── services/
│   ├── dmr-client.ts         # Docker Model Runner API (SSE streaming)
│   ├── model-registry.ts     # model fetching + cycling
│   ├── thinking-parser.ts    # thinking model detection
│   ├── openspec-hook.ts      # OpenSpec step detection
│   ├── devcontainer.ts       # Dockerfile/compose/devcontainer generation
│   ├── project-scaffold.ts   # directory + file scaffolding
│   └── doc-generator.ts      # Diátaxis doc generation
├── skills/
│   └── registry.ts           # loads SKILL.md from subdirectories
├── rules/
│   └── registry.ts           # loads *.md rule files
├── state/
│   └── session.ts            # session save/load
└── types.ts                  # shared types
```

## Stack

| Layer | Library |
|-------|---------|
| CLI parser | [clipse](https://github.com/gouz/clipse) |
| Interactive prompts | [@clack/prompts](https://github.com/bombshell-dev/clack) |
| TUI rendering | [Ink](https://github.com/vadimdemedes/ink) + [TermUI](https://github.com/Arindam200/termui) |
| LLM backend | [Docker Model Runner](https://docs.docker.com/desktop/features/model-runner/) |
| Linter/formatter | [Biome](https://biomejs.dev) |
| Runtime | [Bun](https://bun.sh) |

## License

MIT
