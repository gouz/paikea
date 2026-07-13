export interface ProjectConfig {
  name: string;
  lang: string;
  framework: string;
  database: string[];
  services: string[];
  port: number;
}

export interface Model {
  id: string;
  name: string;
  engine?: string;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface ThinkingState {
  active: boolean;
  content: string;
  tokens: number;
}

export interface Step {
  id: string;
  name: string;
  status: "done" | "current" | "pending";
}

export interface AppState {
  model: Model | null;
  models: Model[];
  messages: Message[];
  steps: Step[];
  thinking: ThinkingState;
  result: string;
  prompt: string;
  scrollOffset: number;
  thinkingVisible: boolean;
  streaming: boolean;
  agentSteps: AgentStep[];
  toolCallsStreaming: Map<string, { name: string; argsBuffer: string }>;
  uiMode: UIMode;
  toolbarIndex: number;
  paletteIndex: number;
  suggestions: string[];
  suggestionIndex: number;
}

export interface DMRChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface DMRChatChunk {
  choices: {
    delta: {
      content?: string;
      reasoning_content?: string;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
    };
    finish_reason: string | null;
  }[];
}

export type ToolHandler = "shell" | "http" | "js" | "builtin";

export interface ToolParameter {
  type: "string" | "number" | "boolean";
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
  handler: ToolHandler;
  command?: string;
  url?: string;
  method?: string;
  script?: string;
  sandbox?: boolean;
  destructive?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, string>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  result: string;
}

export type StreamChunk =
  | { type: "thinking"; text: string }
  | { type: "content"; text: string }
  | { type: "tool_call"; id: string; name: string; arguments: string };

export interface AgentStep {
  id: string;
  type: "tool_call" | "tool_result" | "thinking" | "content";
  name?: string;
  arguments?: Record<string, string>;
  content?: string;
  status: "running" | "done" | "error";
  timestamp: number;
}

export type UIMode = "normal" | "palette" | "toolbar";

export interface Action {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}
