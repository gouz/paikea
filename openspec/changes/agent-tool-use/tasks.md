# Tasks: Agent Tool Use

## Phase 1: Tool Infrastructure

- [ ] Define tool types and interfaces in `src/types.ts`
- [ ] Create `src/services/tool-registry.ts` — tool definitions + JSON schemas
- [ ] Create `src/services/tool-executor.ts` — dispatch tool calls to handlers

## Phase 2: Core Tools

- [ ] Implement `web_search` — scrape DuckDuckGo Lite HTML
- [ ] Implement `get_webpage` — fetch URL, extract text (strip HTML)
- [ ] Implement `read_file` — read file with path validation
- [ ] Implement `list_files` — list directory with .gitignore awareness
- [ ] Implement `write_file` — write file with confirmation prompt
- [ ] Implement `shell_exec` — exec with confirmation prompt + timeout

## Phase 2b: Custom Tool Loading

- [ ] Create `src/tools/registry.ts` — load from bundled + `.paikea/tools/` + `~/.config/paikea/tools/`
- [ ] Define `.tool.json` schema (name, description, parameters, handler, command/url, sandbox)
- [ ] Implement shell handler — `{{param}}` interpolation + command execution
- [ ] Implement http handler — fetch with method/body interpolation
- [ ] Implement js handler — load `.paikea/tools/handlers/*.js`
- [ ] Path validation for sandboxed tools — reject paths outside project root
- [ ] Tool override priority — project tools override bundled, user tools override project

## Phase 3: LLM Integration

- [ ] Update `dmr-client.ts` — pass tools array to API, parse tool_calls in stream
- [ ] Update `StreamChunk` type to include `tool_call` variant
- [ ] Accumulate streamed tool call arguments across chunks

## Phase 4: Event Loop

- [ ] Implement tool loop in `tui-main.ts` — detect tool_calls → execute → re-prompt
- [ ] Add max iterations guard (prevent infinite loops, default: 10)
- [ ] Show tool execution progress in TUI timeline

## Phase 5: TUI & UX

- [ ] Add tool call rendering in timeline component
- [ ] Add tool result rendering in timeline component
- [ ] Confirmation prompts for destructive tools (write_file, shell_exec)
- [ ] Status bar update: show tool count during execution

## Phase 6: Safety

- [ ] Path validation — reject paths outside project root
- [ ] Shell command blocklist — block `rm -rf /`, `sudo`, etc.
- [ ] File write sandboxing — only within project directory
- [ ] Tool call logging to session file
