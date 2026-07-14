import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ToolDefinition } from "../types";

const CUSTOM_TOOL_EXT = ".tool.json";

export function loadTools(projectDir: string): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  // 1. Bundled tools (always available)
  tools.push(...loadBundledTools());

  // 2. User global tools (~/.config/paikea/tools/)
  const userDir = join(homedir(), ".config", "paikea", "tools");
  loadToolsFromDir(userDir, tools);

  // 3. Project tools (.paikea/tools/) — override bundled + user
  const projectDir2 = join(projectDir, ".paikea", "tools");
  loadToolsFromDir(projectDir2, tools);

  return tools;
}

function loadBundledTools(): ToolDefinition[] {
  return [
    {
      name: "web_search",
      description:
        "Search the web using DuckDuckGo. Returns a list of search results with titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
      handler: "builtin",
      sandbox: false,
      destructive: false,
    },
    {
      name: "get_webpage",
      description:
        "Fetch a webpage and return its text content. Useful for reading documentation, blog posts, or any web page.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to fetch",
          },
        },
        required: ["url"],
      },
      handler: "builtin",
      sandbox: false,
      destructive: false,
    },
    {
      name: "read_skill",
      description:
        "Load the full instructions for one of the Available Skills by name. Call this before using a skill whose task you are about to perform.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "The skill name, exactly as listed in Available Skills",
          },
        },
        required: ["name"],
      },
      handler: "builtin",
      sandbox: false,
      destructive: false,
    },
    {
      name: "read_file",
      description:
        "Read the contents of a file. Returns the full text content of the file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to the file (relative to project root)",
          },
        },
        required: ["path"],
      },
      handler: "builtin",
      sandbox: true,
      destructive: false,
    },
    {
      name: "list_files",
      description:
        "List files and directories at a given path. Returns names and types (file/directory).",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Directory path (relative to project root). Use '.' for root.",
          },
        },
        required: ["path"],
      },
      handler: "builtin",
      sandbox: true,
      destructive: false,
    },
    {
      name: "write_file",
      description:
        "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to the file (relative to project root)",
          },
          content: {
            type: "string",
            description: "The content to write to the file",
          },
        },
        required: ["path", "content"],
      },
      handler: "builtin",
      sandbox: true,
      destructive: true,
    },
    {
      name: "shell_exec",
      description:
        "Execute a shell command in the project directory. Returns stdout and stderr.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The shell command to execute",
          },
        },
        required: ["command"],
      },
      handler: "builtin",
      sandbox: true,
      destructive: true,
    },
    {
      name: "git_propose",
      description:
        "Create a git branch for a new OpenSpec proposal. Reads the latest change name from openspec/changes/ and creates a branch named feat/<name>.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      handler: "builtin",
      sandbox: true,
      destructive: false,
    },
    {
      name: "git_commit",
      description:
        "Commit all staged changes with a message based on the current OpenSpec task. Auto-stages all changes and commits with conventional commit format.",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "Commit message (e.g. 'feat(auth): add login endpoint')",
          },
        },
        required: ["message"],
      },
      handler: "builtin",
      sandbox: true,
      destructive: false,
    },
    {
      name: "git_archive",
      description:
        "Archive the OpenSpec change, commit the result, and merge the current feature branch into main (pushing to origin when one exists). Used at the end of the workflow.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      handler: "builtin",
      sandbox: true,
      destructive: false,
    },
  ];
}

function loadToolsFromDir(dir: string, tools: ToolDefinition[]) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(CUSTOM_TOOL_EXT)) continue;

    const filePath = join(dir, entry.name);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const def = JSON.parse(raw) as Record<string, unknown>;

      const tool: ToolDefinition = {
        name: String(def.name ?? entry.name.replace(CUSTOM_TOOL_EXT, "")),
        description: String(def.description ?? ""),
        parameters: normalizeParameters(def.parameters),
        handler: (String(def.handler) as ToolDefinition["handler"]) ?? "shell",
        command: def.command ? String(def.command) : undefined,
        url: def.url ? String(def.url) : undefined,
        method: def.method ? String(def.method) : undefined,
        script: def.script ? String(def.script) : undefined,
        sandbox: Boolean(def.sandbox),
        destructive: Boolean(def.destructive),
      };

      // Override if same name exists
      const idx = tools.findIndex((t) => t.name === tool.name);
      if (idx >= 0) {
        tools[idx] = tool;
      } else {
        tools.push(tool);
      }
    } catch {
      // skip malformed tool files
    }
  }
}

function normalizeParameters(raw: unknown): ToolDefinition["parameters"] {
  if (
    raw &&
    typeof raw === "object" &&
    "type" in raw &&
    (raw as { type: string }).type === "object" &&
    "properties" in raw
  ) {
    return raw as ToolDefinition["parameters"];
  }
  return {
    type: "object",
    properties: {},
    required: [],
  };
}

export function buildToolsPayload(tools: ToolDefinition[]): {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition["parameters"];
  };
}[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export function getToolByName(
  tools: ToolDefinition[],
  name: string,
): ToolDefinition | undefined {
  return tools.find((t) => t.name === name);
}
