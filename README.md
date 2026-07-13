# 🏄 Paikea

A full-screen TUI CLI agent powered by local LLMs via [Docker Model Runner](https://docs.docker.com/desktop/features/model-runner/).

```
paikea
```

## Features

- **Full-screen TUI** — React/Ink components with flexbox layout
- **Local LLMs** — streams via Docker Model Runner (OpenAI-compatible API at `localhost:12434`)
- **Model switching** — Tab / Shift+Tab cycles through available models, or `M` to pick from a list
- **Thinking support** — detects and renders chain-of-thought from Qwen3, DeepSeek-R1, OpenAI o-series
- **OpenSpec integration** — detects propose → plan → design → tasks → apply → archive workflow
- **Skills & rules** — loads from bundled defaults + `.paikea/` + `.claude/` project overrides
- **Session persistence** — saves conversation history to `.paikea/sessions/`
- **Project scaffolding** — `paikea init` creates a full dev environment with devcontainer, OpenSpec, vault, and Diátaxis docs
- **Diátaxis docs** — `paikea doc` generates tutorials, how-to, reference, and explanation documentation
- **Single binary** — compiles to a self-contained executable via `bun build --compile`

## Prerequisites

- [Bun](https://bun.sh) (v1.3+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Model Runner enabled
- At least one model pulled (e.g. `ai/qwen3`)

## Install

```bash
bun install
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
| `Tab` | Accept suggestion, or next model |
| `Shift+Tab` | Previous model |
| `↑` | Open toolbar |
| `:` | Open command palette |
| `←/→` | Move cursor in prompt |
| `Home`/`End` · `Ctrl+A`/`Ctrl+E` | Jump to start/end of prompt |
| `Ctrl+W` / `Ctrl+U` | Delete previous word / to line start |
| `PageUp`/`PageDown` · `Shift+↑`/`Shift+↓` | Scroll the response |

### Initialize a project

```bash
paikea init
```

Creates a new directory with:
- **Devcontainer** — Dockerfile + docker-compose.yml + devcontainer.json
- **OpenSpec** — changes/, specs/ directories
- **Vault** — Context/, Daily/, Intelligence/, Resources/ for Obsidian
- **Skills** — obsidian-cli, obsidian-markdown, defuddle, openspec-*, json-canvas
- **Rules** — TypeScript strict, conventional commits, devcontainer, testing, obsidian, dev practices
- **AGENTS.md** — workflow rules and vault conventions
- **Docs** — Diátaxis documentation scaffold

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
