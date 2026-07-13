# Agent Tool Use

## Problem

Paikea is a TUI client that sends prompts to a local LLM via Docker Model Runner, but it has no ability to take autonomous actions. When the LLM doesn't know how to set up a framework, it can only generate text — it can't search the web, read files, or execute commands to learn and act.

## Solution

Add a tool use (function calling) layer that lets the LLM request actions during a conversation. The LLM returns structured tool calls instead of (or alongside) text, paikea executes them, and feeds results back to the LLM in a loop.

## Scope

- Tool protocol (OpenAI function calling format, supported by DMR)
- Core tools: web search, file read/write, directory listing, shell execution
- Custom tool loading from `.paikea/tools/*.tool.json` and `~/.config/paikea/tools/`
- Event loop: parse tool calls → execute → return results → continue
- TUI integration: show tool calls/results in timeline
- Safety: confirmation prompt before destructive actions (write, shell exec)

## Out of scope

- Multi-agent orchestration
- Persistent memory across sessions
