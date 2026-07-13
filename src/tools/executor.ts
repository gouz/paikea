import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import type { ToolCall, ToolDefinition, ToolResult } from "../types";

const BLOCKED_COMMANDS = [
  "rm -rf /",
  "rm -rf /*",
  "sudo",
  "mkfs",
  ":(){:|:&};:",
];

export async function executeTool(
  toolCall: ToolCall,
  toolDef: ToolDefinition,
  projectDir: string,
  confirm: (message: string) => Promise<boolean>,
): Promise<ToolResult> {
  const { id, name, arguments: args } = toolCall;

  // Safety check for destructive tools
  if (toolDef.destructive) {
    const summary = formatToolSummary(name, args);
    const approved = await confirm(summary);
    if (!approved) {
      return {
        toolCallId: id,
        name,
        success: false,
        result: "Cancelled by user.",
      };
    }
  }

  try {
    switch (toolDef.handler) {
      case "builtin":
        return await executeBuiltin(name, args, projectDir);
      case "shell":
        return executeShellTool(toolDef, args, projectDir);
      case "http":
        return await executeHttpTool(toolDef, args);
      case "js":
        return executeJsTool(toolDef, args, projectDir);
      default:
        return {
          toolCallId: id,
          name,
          success: false,
          result: "Unknown handler.",
        };
    }
  } catch (error) {
    return {
      toolCallId: id,
      name,
      success: false,
      result: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function formatToolSummary(name: string, args: Record<string, string>): string {
  switch (name) {
    case "write_file":
      return `Write file: ${args.path ?? "?"}`;
    case "shell_exec":
      return `Run command: ${args.command ?? "?"}`;
    case "git_propose":
      return "Create branch for latest proposal?";
    case "git_commit":
      return `Commit: ${args.message ?? "?"}`;
    case "git_archive":
      return "Push branch and archive change?";
    default:
      return `Execute ${name}?`;
  }
}

// ─── Built-in tools ──────────────────────────────────────────────

async function executeBuiltin(
  name: string,
  args: Record<string, string>,
  projectDir: string,
): Promise<ToolResult> {
  const id = `builtin_${Date.now()}`;

  switch (name) {
    case "web_search":
      return {
        toolCallId: id,
        name,
        success: true,
        result: await webSearch(args.query ?? ""),
      };
    case "get_webpage":
      return {
        toolCallId: id,
        name,
        success: true,
        result: await getWebpage(args.url ?? ""),
      };
    case "read_file":
      return {
        toolCallId: id,
        name,
        success: true,
        result: readFile(args.path ?? "", projectDir),
      };
    case "list_files":
      return {
        toolCallId: id,
        name,
        success: true,
        result: listFiles(args.path ?? ".", projectDir),
      };
    case "write_file":
      return {
        toolCallId: id,
        name,
        success: true,
        result: writeFile(args.path ?? "", args.content ?? "", projectDir),
      };
    case "shell_exec":
      return {
        toolCallId: id,
        name,
        success: true,
        result: shellExec(args.command ?? "", projectDir),
      };
    case "git_propose":
      return {
        toolCallId: id,
        name,
        success: true,
        result: gitPropose(projectDir),
      };
    case "git_commit":
      return {
        toolCallId: id,
        name,
        success: true,
        result: gitCommit(args.message ?? "", projectDir),
      };
    case "git_archive":
      return {
        toolCallId: id,
        name,
        success: true,
        result: gitArchive(projectDir),
      };
    default:
      return {
        toolCallId: id,
        name,
        success: false,
        result: `Unknown built-in tool: ${name}`,
      };
  }
}

// ─── Web search (DuckDuckGo Lite) ───────────────────────────────

async function webSearch(query: string): Promise<string> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; paikea/0.1)",
    },
  });
  const html = await res.text();
  return parseDuckDuckGoLite(html);
}

function parseDuckDuckGoLite(html: string): string {
  const results: string[] = [];
  const linkRegex =
    /<a[^>]+class="result-link"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
  const snippetRegex = /<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

  const links: { url: string; title: string }[] = [];
  for (const m of html.matchAll(linkRegex)) {
    links.push({
      url: m[1] ?? "",
      title: (m[2] ?? "").trim(),
    });
  }

  const snippets: string[] = [];
  for (const m of html.matchAll(snippetRegex)) {
    snippets.push((m[1] ?? "").replace(/<[^>]+>/g, "").trim());
  }

  for (let i = 0; i < links.length && i < 10; i++) {
    const link = links[i];
    if (!link) continue;
    const snippet = snippets[i] ?? "";
    results.push(`${i + 1}. ${link.title}\n   ${link.url}\n   ${snippet}`);
  }

  return results.length > 0 ? results.join("\n\n") : "No results found.";
}

// ─── Webpage fetch ──────────────────────────────────────────────

async function getWebpage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; paikea/0.1)",
    },
  });
  const html = await res.text();
  return stripHtml(html).slice(0, 8000);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── File operations ────────────────────────────────────────────

function readFile(path: string, projectDir: string): string {
  const resolved = resolvePath(path, projectDir);
  if (!existsSync(resolved)) return `File not found: ${path}`;
  const content = readFileSync(resolved, "utf-8");
  return content.length > 10000
    ? `${content.slice(0, 10000)}\n... (truncated, ${content.length} chars total)`
    : content;
}

function listFiles(path: string, projectDir: string): string {
  const resolved = resolvePath(path, projectDir);
  if (!existsSync(resolved)) return `Directory not found: ${path}`;
  const entries = readdirSync(resolved, { withFileTypes: true });
  return entries
    .map((e) => `${e.isDirectory() ? "d" : "f"} ${e.name}`)
    .join("\n");
}

function writeFile(path: string, content: string, projectDir: string): string {
  const resolved = resolvePath(path, projectDir);
  mkdirSync(join(resolved, ".."), { recursive: true });
  writeFileSync(resolved, content, "utf-8");
  return `Written ${content.length} bytes to ${path}`;
}

function shellExec(command: string, projectDir: string): string {
  for (const blocked of BLOCKED_COMMANDS) {
    if (command.includes(blocked)) {
      return `Blocked: command "${blocked}" is not allowed.`;
    }
  }
  try {
    const stdout = execSync(command, {
      cwd: projectDir,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return stdout.length > 8000
      ? `${stdout.slice(0, 8000)}\n... (truncated)`
      : stdout;
  } catch (error) {
    const err = error as { status?: number; stderr?: string; message?: string };
    return `Exit ${err.status ?? "?"}: ${err.stderr ?? err.message ?? "unknown error"}`;
  }
}

// ─── Custom tool handlers ───────────────────────────────────────

function executeShellTool(
  toolDef: ToolDefinition,
  args: Record<string, string>,
  projectDir: string,
): ToolResult {
  let command = toolDef.command ?? "";
  for (const [key, value] of Object.entries(args)) {
    command = command.replaceAll(`{{${key}}}`, value);
  }
  const result = shellExec(command, projectDir);
  return {
    toolCallId: `shell_${Date.now()}`,
    name: toolDef.name,
    success: true,
    result,
  };
}

async function executeHttpTool(
  toolDef: ToolDefinition,
  args: Record<string, string>,
): Promise<ToolResult> {
  let url = toolDef.url ?? "";
  for (const [key, value] of Object.entries(args)) {
    url = url.replaceAll(`{{${key}}}`, value);
  }
  const res = await fetch(url, {
    method: (toolDef.method ?? "GET").toUpperCase(),
  });
  const body = await res.text();
  return {
    toolCallId: `http_${Date.now()}`,
    name: toolDef.name,
    success: res.ok,
    result: body.slice(0, 8000),
  };
}

function executeJsTool(
  toolDef: ToolDefinition,
  args: Record<string, string>,
  projectDir: string,
): ToolResult {
  const scriptPath = toolDef.script
    ? resolve(projectDir, ".paikea/tools/handlers", toolDef.script)
    : undefined;
  if (!scriptPath || !existsSync(scriptPath)) {
    return {
      toolCallId: `js_${Date.now()}`,
      name: toolDef.name,
      success: false,
      result: `Script not found: ${toolDef.script ?? "none"}`,
    };
  }
  const script = readFileSync(scriptPath, "utf-8");
  const fn = new Function("args", "projectDir", script);
  const result = fn(args, projectDir) as string;
  return {
    toolCallId: `js_${Date.now()}`,
    name: toolDef.name,
    success: true,
    result: String(result),
  };
}

// ─── Git tools ─────────────────────────────────────────────────

function gitPropose(projectDir: string): string {
  const changesDir = join(projectDir, "openspec", "changes");
  if (!existsSync(changesDir)) {
    return "No openspec/changes/ directory found. Create a proposal first.";
  }

  const entries = readdirSync(changesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);

  if (entries.length === 0) {
    return "No changes found in openspec/changes/. Create a proposal first.";
  }

  const latest = entries[entries.length - 1] as string;
  const branchName = `feat/${latest}`;

  try {
    execSync(`git checkout -b ${branchName}`, {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return `Created and switched to branch: ${branchName}`;
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    return `Failed to create branch: ${err.stderr ?? err.message ?? "unknown error"}`;
  }
}

function gitCommit(message: string, projectDir: string): string {
  try {
    execSync("git add -A", {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const result = execSync(`git commit -m "${message}"`, {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return result.trim() || `Committed: ${message}`;
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    return `Commit failed: ${err.stderr ?? err.message ?? "unknown error"}`;
  }
}

function gitArchive(projectDir: string): string {
  try {
    const branch = execSync("git branch --show-current", {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (!branch) {
      return "Not on a branch. Cannot push.";
    }

    execSync(`git push -u origin ${branch}`, {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const archiveResult = execSync("openspec archive", {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return `Pushed branch ${branch} to origin.\n${archiveResult.trim()}`;
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    return `Archive failed: ${err.stderr ?? err.message ?? "unknown error"}`;
  }
}

// ─── Path safety ────────────────────────────────────────────────

function resolvePath(path: string, projectDir: string): string {
  const resolved = resolve(projectDir, path);
  const projectResolved = resolve(projectDir);
  if (!resolved.startsWith(projectResolved)) {
    return join(projectDir, path.replace(/^\.\//, ""));
  }
  return resolved;
}
