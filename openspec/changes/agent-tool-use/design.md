# Design: Agent Tool Use

## Architecture

```
User prompt
    ↓
LLM (with tools in system prompt)
    ↓
Response contains tool_calls? ──yes──→ Execute tools ──→ Feed results back to LLM ──→ loop
    │                                        │
    no                                       ↓
    ↓                                  Show results in TUI
Final text response
```

## Tool Protocol

Use OpenAI function calling format (compatible with DMR):

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "web_search",
        "description": "Search the web for information",
        "parameters": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Search query" }
          },
          "required": ["query"]
        }
      }
    }
  ]
}
```

When the LLM wants to call a tool, it returns:
```json
{
  "choices": [{
    "delta": {
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "web_search",
          "arguments": "{\"query\": \"next.js app router setup\"}"
        }
      }]
    }
  }]
}
```

## Tools

### Read-only (no confirmation)
- `web_search(query)` — DuckDuckGo Lite HTML scraping (no API key needed)
- `read_file(path)` — Read file contents
- `list_files(path)` — List directory entries
- `get_webpage(url)` — Fetch and extract text from a URL

### Destructive (require confirmation)
- `write_file(path, content)` — Write/create a file
- `shell_exec(command)` — Execute a shell command

## Streaming Changes

Current `streamChat` yields `{ type: "thinking" | "content", text }`.

New yield type:
```typescript
type StreamChunk =
  | { type: "thinking"; text: string }
  | { type: "content"; text: string }
  | { type: "tool_call"; id: string; name: string; arguments: string }
```

Tool calls accumulate across chunks (arguments stream in). When the stream ends with tool calls, the event loop executes them.

## Event Loop (in tui-main.ts)

```
while true:
  response = streamChat(messages, model, tools)
  if response has tool_calls:
    for each tool_call:
      show in timeline: "🔧 calling web_search..."
      result = executeTool(tool_call)
      show in timeline: "✓ result: ..."
      messages.push({ role: "tool", tool_call_id, content: result })
    continue loop
  else:
    show final text response
    break
```

## Tool Sources

Tools come from 3 sources (in priority order):

1. **Bundled** — core tools compiled into the binary (`src/tools/`)
2. **Project** — `.paikea/tools/*.tool.json` files in the project root
3. **User** — `~/.config/paikea/tools/*.tool.json` global tools

### Custom Tool Format

`.paikea/tools/` contains JSON files defining tools:

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
  "sandbox": true
}
```

Handler types:
- `"shell"` — run `command` with parameter interpolation (`{{param}}`)
- `"http"` — fetch `url` with method/body interpolation
- `"js"` — execute a `.js` file from `.paikea/tools/handlers/`

### Tool Registry

```
src/tools/
├── registry.ts          # loads from bundled + .paikea/tools/ + ~/.config/paikea/tools/
├── web-search.ts        # bundled: web_search
├── file-ops.ts          # bundled: read_file, write_file, list_files
├── shell-exec.ts        # bundled: shell_exec
└── webpage.ts           # bundled: get_webpage
```

## Safety Model

- Read-only tools: execute immediately
- Destructive tools: show confirmation prompt (`@clack/prompts confirm`)
- Shell exec: show command, require Enter to confirm
- Write file: show path + first 20 lines, require Enter to confirm
- Custom tools with `"sandbox": true`: validate paths stay within project root

## TUI Timeline Changes

New message types in timeline:
```
🔧 web_search("next.js app router setup")
  → Found 5 results...
📝 write_file("src/app/page.tsx")
  → Created (142 lines)
💻 shell_exec("bun install")
  → Done (exit 0)
```

## Limitations

- DuckDuckGo scraping may break if they change their HTML
- Shell exec runs in the project directory (sandboxed by CWD)
- No streaming of tool results back to LLM (batch only)
- Tool call arguments may be truncated by context window limits
