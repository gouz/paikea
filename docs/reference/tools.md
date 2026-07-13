# Built-in tools

During a turn the model can call tools; paikea executes them and feeds the
result back into the conversation. Read-only tools run immediately; destructive
tools require confirmation.

## Bundled tools

| Tool | Parameters | Destructive | Description |
|------|-----------|:-----------:|-------------|
| `web_search` | `query` | no | Search the web via DuckDuckGo; returns titles, URLs, snippets |
| `get_webpage` | `url` | no | Fetch a page and return its text content |
| `read_skill` | `name` | no | Load a skill's full instructions on demand by name |
| `read_file` | `path` | no | Read a file (relative to the project root) |
| `list_files` | `path` | no | List files and directories at a path |
| `write_file` | `path`, `content` | **yes** | Create or overwrite a file |
| `shell_exec` | `command` | **yes** | Run a shell command in the project directory |
| `git_propose` | — | no | Create a `feat/<name>` branch for the latest OpenSpec change |
| `git_commit` | `message` | no | Stage all changes and commit (conventional format) |
| `git_archive` | — | no | Push the feature branch and archive the OpenSpec change |

`read_skill` pairs with the skills manifest in the system prompt: the prompt
lists skills by name and description, and the model calls `read_skill` to pull a
skill's full text only when it needs it.

## Custom tools

Tools are loaded from three sources, later ones overriding earlier ones by name:

1. **Bundled** — compiled into the binary (the table above)
2. **User-global** — `~/.config/paikea/tools/*.tool.json`
3. **Project** — `.paikea/tools/*.tool.json`

A `*.tool.json` file defines one tool:

```json
{
  "name": "search_npm",
  "description": "Search npm packages",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Package name or keywords" }
    },
    "required": ["query"]
  },
  "handler": "shell",
  "command": "npm search {{query}} --json | head -20",
  "sandbox": true,
  "destructive": false
}
```

| Field | Description |
|-------|-------------|
| `handler` | `shell` (run `command`), `http` (fetch `url`), or `js` (run a `.js` script) |
| `command` / `url` / `method` / `script` | Handler-specific payload, with `{{param}}` interpolation |
| `sandbox` | Validate that file paths stay within the project root |
| `destructive` | Require a confirmation prompt before running |
