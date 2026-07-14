# Obsidian Vault + OpenSpec Workflow

## Available Skills

Load these when working with Obsidian or OpenSpec:
- `obsidian-markdown` — OFM, wikilinks, embeds, callouts, frontmatter
- `obsidian-cli` — Interact with vault, notes, tasks, plugins
- `obsidian-bases` — .base files, views, filters, formulas
- `json-canvas` — .canvas files, nodes, edges
- `defuddle` — Clean markdown from URLs
- `openspec-propose` — Create changes with proposal/design/tasks
- `openspec-apply-change` — Implement tasks from a change
- `openspec-archive-change` — Archive completed changes

## Vault Structure

| Folder | Content |
|--------|---------|
| `Context/` | Profile, Business, ICP, Goals, Projects |
| `Daily/` | `YYYY-MM-DD.md` — one note per day |
| `Intelligence/` | Research, decisions, architecture |
| `Resources/` | Templates, patterns, snippets |
| `Inbox.md` | Unsorted ideas |
| `openspec/changes/` | OpenSpec changes |
| `openspec/specs/` | OpenSpec specifications |

## Required Frontmatter

```yaml
---
date: YYYY-MM-DD
tags: []
type: note | project | context | daily | research | resource
status: draft | active | archive
---
```

## Wiki Links

- Link: `[[Note Name]]`
- Embed: `![[Note#Section]]`
- Label: `[[path|Display Text]]`

## OpenSpec Workflow

Paikea utilise automatiquement OpenSpec pour les étapes suivantes : proposal, design, specs, tasks, archive.

Pour chaque proposition, **créer une branche dédiée** avant de commencer l'implémentation.

1. Propose: `openspec new change <name>` ou utiliser le skill `openspec-propose` → puis `/git-propose`
2. Design: Créer `proposal.md`, `design.md`, `tasks.md`
3. Specs: Créer les spécifications dans `openspec/specs/`
4. Tasks: Utiliser le skill `openspec-apply-change` → puis `/git-commit` après chaque tâche
5. Archive: Utiliser le skill `openspec-archive-change` → puis `/git-archive`

## Vault Rules

- Update `Daily/YYYY-MM-DD.md` after every action
- Every note needs at least one wiki link
- Rejected ideas → `status: archive`, never delete


## Vault Growth

- Well-reasoned technical/business decision → `Intelligence/`
- Reusable pattern/snippet → `Resources/`
- Technical project → its own `CLAUDE.md` (the vault connects them)

## Reminders

- Vault = thought journal, not a record of final decisions
- Rejected ideas = `status: archive`, never deleted
- Never proactively mention OpenSpec to the user — only use it when explicitly asked

## Token Optimization
- Responses: short, direct, no preamble, no summary
- No "I'll now...", no "Great!", no redundant explanations
- Code only when asked; prefer inline edits over full file rewrites
- If unsure, ask one short question — don't guess and over-generate

## File Access — NEVER READ
- All paths matching .gitignore patterns (see below)
- node_modules/, .venv/, venv/, env/, __pycache__/, target/, dist/, build/
- *.lock files (package-lock.json, yarn.lock, Cargo.lock, poetry.lock, uv.lock)
- *.log, *.tmp, *.cache
- .git/ internals
- coverage/, .nyc_output/, htmlcov/
- .next/, .nuxt/, .svelte-kit/, out/
- *.min.js, *.min.css, *.map
- __generated__/, generated/, vendor/
- .terraform/, .pulumi/
- *.egg-info/, .eggs/, dist-info/

## Common .gitignore to create if missing
If no .gitignore exists, create one with:
```
# Dependencies
node_modules/
.venv/
venv/
env/

# Build outputs
dist/
build/
target/
out/
*.egg-info/

# Cache
__pycache__/
.cache/
.next/
.nuxt/
coverage/
htmlcov/
.nyc_output/

# Locks (read-only, skip)
# package-lock.json  ← keep for npm ci
# Cargo.lock         ← keep for bins

# Env & secrets
.env
.env.*
!.env.example

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db
```

## Exploration Strategy
1. Read only: README, package.json / Cargo.toml / pyproject.toml / go.mod
2. Then: src/ or lib/ entry points
3. Ask before reading more than 5 files in one go

## Response Format
- Bug fix → show only the changed lines + brief reason
- New feature → minimal working implementation, no scaffolding unless asked
- Explanation → 3 lines max unless more depth is explicitly requested


## Library Research

When a user mentions or asks to use a library/package you don't know well, search the internet (`websearch` + `webfetch`) before answering. Look up: official docs, installation, basic usage, and compatibility. Never guess API or usage — always verify.

## Hard Rules

1. **Daily first** — Update `Daily/YYYY-MM-DD.md` after every action (summary, decisions, links to affected notes)
2. **No orphans** — Every note has at least one wiki link `[[incoming or outgoing]]`
3. **Capture everything** — Ideas, decisions, and rejections in `Inbox.md` or a dedicated note
