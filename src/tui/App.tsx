import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildRulesPrompt, loadRules } from "../rules/registry";
import { streamChat } from "../services/dmr-client";
import { fetchModels, nextModel, prevModel } from "../services/model-registry";
import { detectOpenSpecSteps } from "../services/openspec-hook";
import { computeSuggestions, getCurrentStepId } from "../services/suggestions";
import { hasThinkingSupport } from "../services/thinking-parser";
import { buildSkillsPrompt, loadSkills } from "../skills/registry";
import { getSavedTheme, saveTheme } from "../state/config";
import { createSessionId, saveSession } from "../state/session";
import { executeTool } from "../tools/executor";
import { loadTools } from "../tools/registry";
import type {
  Action,
  AgentStep,
  Message,
  Model,
  Step,
  ToolCall,
  ToolDefinition,
} from "../types";
import { AgentSteps } from "./components/AgentSteps";
import { CommandPalette } from "./components/CommandPalette";
import { Header } from "./components/Header";
import { PromptInput } from "./components/PromptInput";
import { ResultPane } from "./components/ResultPane";
import { StatusBar } from "./components/StatusBar";
import { ThinkingPane } from "./components/ThinkingPane";
import { Timeline } from "./components/Timeline";
import { useLayout } from "./hooks/use-terminal";
import { getThemeNames, setThemeByName } from "./theme";

const MAX_TOOL_ITERATIONS = 10;

type UIMode = "normal" | "palette" | "toolbar";

interface AppState {
  model: Model | null;
  models: Model[];
  messages: Message[];
  steps: Step[];
  thinking: { active: boolean; content: string; tokens: number };
  result: string;
  scrollOffset: number;
  thinkingVisible: boolean;
  streaming: boolean;
  agentSteps: AgentStep[];
  uiMode: UIMode;
  toolbarIndex: number;
  paletteIndex: number;
  suggestions: string[];
  suggestionIndex: number;
  confirmQuit: boolean;
  selectedStepIndex: number;
  themeTick: number;
}

export function App() {
  const { exit } = useApp();
  const layout = useLayout();

  const [state, setState] = useState<AppState>({
    model: null,
    models: [],
    messages: [],
    steps: [],
    thinking: { active: false, content: "", tokens: 0 },
    result: "",
    scrollOffset: 0,
    thinkingVisible: true,
    streaming: false,
    agentSteps: [],
    uiMode: "normal",
    toolbarIndex: 0,
    paletteIndex: 0,
    suggestions: [],
    suggestionIndex: -1,
    confirmQuit: false,
    selectedStepIndex: 0,
    themeTick: 0,
  });

  const [prompt, setPrompt] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const streamAbortRef = useRef<AbortController | null>(null);
  const cwd = useRef(process.cwd());
  const sessionId = useRef(createSessionId());
  const systemPromptRef = useRef("");
  const toolsRef = useRef<ToolDefinition[]>([]);

  // Initialize
  useEffect(() => {
    async function init() {
      const savedTheme = getSavedTheme();
      setThemeByName(savedTheme);

      const models = await fetchModels();
      if (models.length === 0) {
        console.error(
          "No models found in Docker Model Runner. Run: docker model pull ai/qwen3",
        );
        exit();
        return;
      }

      const steps = detectOpenSpecSteps(cwd.current);
      const stepId = getCurrentStepId(steps);
      const initialSuggestions = computeSuggestions("", stepId);

      const skills = loadSkills(cwd.current);
      const rules = loadRules();
      const tools = loadTools(cwd.current);
      toolsRef.current = tools;
      systemPromptRef.current =
        buildSkillsPrompt(skills) + buildRulesPrompt(rules);

      setState((s) => ({
        ...s,
        models,
        model: models[0] ?? null,
        steps,
        suggestions: initialSuggestions,
      }));
    }
    void init();
  }, [exit]);

  const update = useCallback((partial: Partial<AppState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || !state.model || state.streaming) return;

    const userPrompt = prompt;
    setPrompt("");
    setCursorPos(0);

    const userMessage: Message = {
      role: "user",
      content: userPrompt,
      timestamp: Date.now(),
    };

    update({
      streaming: true,
      result: "",
      agentSteps: [],
      suggestions: [],
      scrollOffset: 0,
      messages: [...state.messages, userMessage],
    });

    const model = state.model;
    if (!model) return;
    const useThinking = hasThinkingSupport(model.id);

    const messages: {
      role: string;
      content: string;
      tool_call_id?: string;
      name?: string;
    }[] = [{ role: "system", content: systemPromptRef.current }];

    for (const msg of [...state.messages, userMessage]) {
      messages.push({ role: msg.role, content: msg.content });
    }

    streamAbortRef.current = new AbortController();
    try {
      await runAgentLoop(
        messages,
        model.id,
        useThinking,
        toolsRef.current,
        cwd.current,
        update,
        streamAbortRef.current.signal,
      );
    } catch (err) {
      if (streamAbortRef.current?.signal.aborted) {
        update({
          result: `${state.result}\n\n[Generation cancelled]`,
        });
      } else {
        update({ result: `Error: ${err}` });
      }
    } finally {
      streamAbortRef.current = null;
    }

    setState((s) => {
      const finalResult = s.result;
      const assistantMessage: Message = {
        role: "assistant",
        content: finalResult,
        timestamp: Date.now(),
      };
      const newMessages = [...s.messages, assistantMessage];

      saveSession({
        id: sessionId.current,
        date:
          new Date().toISOString().split("T")[0] ?? new Date().toISOString(),
        model: model.name,
        messages: newMessages,
      });

      // Sync OpenSpec to vault
      try {
        import("../services/openspec-sync").then((m) =>
          m.syncOpenSpecToVault(cwd.current),
        );
      } catch {
        // Silent fail
      }

      return { ...s, streaming: false, messages: newMessages };
    });
  }, [
    prompt,
    state.model,
    state.streaming,
    state.messages,
    state.result,
    update,
  ]);

  const cancelStreaming = useCallback(() => {
    if (!state.streaming) return false;
    streamAbortRef.current?.abort();
    return true;
  }, [state.streaming]);

  const quit = useCallback(() => {
    streamAbortRef.current?.abort();
    exit();
  }, [exit]);

  // Actions for palette and toolbar
  const themeActions: Action[] = getThemeNames().map((name) => ({
    id: `theme-${name}`,
    label: `Theme: ${name}`,
    shortcut: "",
    action: () => {
      setThemeByName(name);
      saveTheme(name);
      update({ themeTick: state.themeTick + 1 });
    },
  }));

  const actions: Action[] = [
    {
      id: "model",
      label: "Switch Model",
      shortcut: "Tab",
      action: () => {
        const newModel = nextModel();
        if (newModel) {
          update({
            model: newModel,
            steps: detectOpenSpecSteps(cwd.current),
          });
        }
      },
    },
    {
      id: "thinking",
      label: "Toggle Thinking",
      shortcut: "",
      action: () => update({ thinkingVisible: !state.thinkingVisible }),
    },
    ...themeActions,
    {
      id: "clear",
      label: "Clear",
      shortcut: "",
      action: () =>
        update({
          result: "",
          thinking: { active: false, content: "", tokens: 0 },
          agentSteps: [],
          scrollOffset: 0,
        }),
    },
    {
      id: "quit",
      label: "Quit",
      shortcut: "Esc",
      action: () => quit(),
    },
  ];

  const executeAction = useCallback(
    (action: Action | undefined) => {
      if (!action) return;
      action.action();
      update({ uiMode: "normal" });
    },
    [update],
  );

  // Keyboard handler
  useInput((input, key) => {
    const s = state;

    // Ctrl+C / Ctrl+D — immediate quit
    if (key.ctrl && (input === "c" || input === "d")) {
      if (cancelStreaming()) return;
      quit();
      return;
    }

    // Palette mode
    if (s.uiMode === "palette") {
      if (key.escape) {
        update({ uiMode: "normal" });
        return;
      }
      if (key.upArrow) {
        update({ paletteIndex: Math.max(0, s.paletteIndex - 1) });
        return;
      }
      if (key.downArrow) {
        update({
          paletteIndex: Math.min(actions.length - 1, s.paletteIndex + 1),
        });
        return;
      }
      if (key.return) {
        executeAction(actions[s.paletteIndex]);
        return;
      }
      return;
    }

    // Toolbar mode
    if (s.uiMode === "toolbar") {
      if (key.escape) {
        update({ uiMode: "normal" });
        return;
      }
      if (key.tab) {
        update({ toolbarIndex: (s.toolbarIndex + 1) % 4 });
        return;
      }
      if (key.return) {
        if (s.toolbarIndex === 3) {
          update({ uiMode: "palette", toolbarIndex: 0 });
        } else {
          executeAction(actions[s.toolbarIndex]);
        }
        return;
      }
      return;
    }

    // Normal mode
    if (key.escape) {
      if (s.confirmQuit) {
        quit();
        return;
      }
      if (cancelStreaming()) return;
      update({ confirmQuit: true });
      return;
    }

    // Any other key dismisses quit confirmation
    if (s.confirmQuit) {
      update({ confirmQuit: false });
      return;
    }

    if (key.return && !key.ctrl) {
      if (!s.streaming) {
        void handleSubmit();
      }
      return;
    }

    // Scroll
    if (key.pageUp || (key.upArrow && key.shift)) {
      update({ scrollOffset: Math.max(0, s.scrollOffset - 5) });
      return;
    }
    if (key.pageDown || (key.downArrow && key.shift)) {
      update({ scrollOffset: s.scrollOffset + 5 });
      return;
    }

    // Shift+Tab = prev model
    if (key.tab && key.shift) {
      const newModel = prevModel();
      if (newModel) {
        update({ model: newModel, steps: detectOpenSpecSteps(cwd.current) });
      }
      return;
    }

    // Tab = accept suggestion or next model
    if (key.tab) {
      if (s.suggestions.length > 0 && s.uiMode === "normal") {
        const idx = s.suggestionIndex >= 0 ? s.suggestionIndex : 0;
        const suggestion = s.suggestions[idx];
        if (suggestion) {
          setPrompt(suggestion);
          setCursorPos(suggestion.length);
        }
      } else {
        const newModel = nextModel();
        if (newModel) {
          update({
            model: newModel,
            steps: detectOpenSpecSteps(cwd.current),
          });
        }
      }
      return;
    }

    // Ctrl+Left/Right to navigate steps
    if (key.ctrl && key.leftArrow) {
      update({ selectedStepIndex: Math.max(0, s.selectedStepIndex - 1) });
      return;
    }
    if (key.ctrl && key.rightArrow) {
      update({
        selectedStepIndex: Math.min(
          s.steps.length - 1,
          s.selectedStepIndex + 1,
        ),
      });
      return;
    }

    // Ctrl+P to open palette
    if (key.ctrl && input === "p") {
      update({ uiMode: "palette", paletteIndex: 0 });
      return;
    }

    // Arrow keys
    if (key.leftArrow) {
      setCursorPos((p) => Math.max(0, p - 1));
      return;
    }
    if (key.rightArrow) {
      setCursorPos((p) => Math.min(prompt.length, p + 1));
      return;
    }
    if (key.upArrow) {
      update({ uiMode: "toolbar", toolbarIndex: 0 });
      return;
    }
    if (key.downArrow) {
      update({ uiMode: "normal" });
      return;
    }

    // Prompt editing
    if (key.backspace) {
      setPrompt((p) => p.slice(0, cursorPos - 1) + p.slice(cursorPos));
      setCursorPos((p) => Math.max(0, p - 1));
      const stepId = getCurrentStepId(s.steps);
      const suggestions = computeSuggestions(prompt, stepId);
      update({ suggestions, suggestionIndex: -1 });
      return;
    }
    if (key.delete) {
      setPrompt((p) => p.slice(0, cursorPos) + p.slice(cursorPos + 1));
      const stepId = getCurrentStepId(s.steps);
      const suggestions = computeSuggestions(prompt, stepId);
      update({ suggestions, suggestionIndex: -1 });
      return;
    }
    if (key.home || (key.ctrl && input === "a")) {
      setCursorPos(0);
      return;
    }
    if (key.end || (key.ctrl && input === "e")) {
      setCursorPos(prompt.length);
      return;
    }
    if (key.ctrl && input === "u") {
      setPrompt(prompt.slice(cursorPos));
      setCursorPos(0);
      return;
    }
    if (key.ctrl && input === "w") {
      const before = prompt.slice(0, cursorPos);
      const trimmed = before.replace(/\s*\S+\s*$/, "");
      setPrompt(trimmed + prompt.slice(cursorPos));
      setCursorPos(trimmed.length);
      return;
    }

    // Regular character
    if (input && !key.ctrl && !key.meta) {
      setPrompt((p) => p.slice(0, cursorPos) + input + p.slice(cursorPos));
      setCursorPos((p) => p + input.length);
      const stepId = getCurrentStepId(s.steps);
      const suggestions = computeSuggestions(
        prompt.slice(0, cursorPos) + input + prompt.slice(cursorPos),
        stepId,
      );
      update({ suggestions, suggestionIndex: -1 });
    }
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Header model={state.model} />
      <Timeline steps={state.steps} selectedIndex={state.selectedStepIndex} />
      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        <ThinkingPane
          content={state.thinking.content}
          visible={state.thinkingVisible}
          maxHeight={layout.thinkingMax}
        />
        <AgentSteps steps={state.agentSteps} maxHeight={layout.agentMax} />
        <ResultPane
          content={state.result}
          scrollOffset={state.scrollOffset}
          maxHeight={layout.resultHeight}
        />
      </Box>
      <PromptInput
        prompt={prompt}
        cursorPos={cursorPos}
        focused={state.uiMode === "normal"}
        suggestions={state.suggestions}
        suggestionIndex={state.suggestionIndex}
      />
      <StatusBar
        model={state.model}
        tokens={state.thinking.tokens}
        streaming={state.streaming}
        toolbarIndex={state.toolbarIndex}
        isToolbarMode={state.uiMode === "toolbar"}
        confirmQuit={state.confirmQuit}
      />
      {state.uiMode === "palette" && (
        <CommandPalette actions={actions} selectedIndex={state.paletteIndex} />
      )}
    </Box>
  );
}

async function runAgentLoop(
  messages: {
    role: string;
    content: string;
    tool_call_id?: string;
    name?: string;
  }[],
  modelId: string,
  useThinking: boolean,
  tools: ToolDefinition[],
  projectDir: string,
  update: (partial: Partial<AppState>) => void,
  signal?: AbortSignal,
) {
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    if (signal?.aborted) return;
    iterations++;
    let thinkingContent = "";
    let resultContent = "";
    const toolCallsByName = new Map<
      string,
      { id: string; name: string; argsBuffer: string }
    >();

    const stream = streamChat(messages, modelId, tools, signal);

    if (useThinking) {
      for await (const chunk of stream) {
        if (chunk.type === "thinking") {
          thinkingContent += chunk.text;
          update({
            thinking: {
              active: true,
              content: thinkingContent,
              tokens: thinkingContent.length,
            },
          });
        } else if (chunk.type === "content") {
          resultContent += chunk.text;
          update({ result: resultContent });
        } else if (chunk.type === "tool_call") {
          accumulateToolCall(
            toolCallsByName,
            chunk.id,
            chunk.name,
            chunk.arguments,
          );
        }
      }
    } else {
      for await (const chunk of stream) {
        if (chunk.type === "content") {
          resultContent += chunk.text;
          update({ result: resultContent });
        } else if (chunk.type === "tool_call") {
          accumulateToolCall(
            toolCallsByName,
            chunk.id,
            chunk.name,
            chunk.arguments,
          );
        }
      }
    }

    if (toolCallsByName.size === 0) {
      update({ result: resultContent });
      return;
    }

    const completedToolCalls: ToolCall[] = [];
    for (const [, acc] of toolCallsByName) {
      let args: Record<string, string> = {};
      try {
        args = JSON.parse(acc.argsBuffer) as Record<string, string>;
      } catch {
        // malformed args
      }

      const toolCall: ToolCall = {
        id: acc.id,
        name: acc.name,
        arguments: args,
      };
      completedToolCalls.push(toolCall);

      const stepId = `step_${Date.now()}_${acc.id}`;
      update({
        agentSteps: [
          ...completedToolCalls.map((tc) => ({
            id: `step_${tc.id}`,
            type: "tool_call" as const,
            name: tc.name,
            arguments: tc.arguments,
            status: "done" as const,
            timestamp: Date.now(),
          })),
          {
            id: stepId,
            type: "tool_call",
            name: acc.name,
            arguments: args,
            status: "running",
            timestamp: Date.now(),
          },
        ],
      });

      const toolDef = tools.find((t) => t.name === acc.name);
      if (!toolDef) continue;

      const confirmFn = async (message: string): Promise<boolean> => {
        // In Ink, confirmation is handled differently
        // For now, auto-approve
        console.error(`Confirm: ${message}`);
        return true;
      };

      const result = await executeTool(
        toolCall,
        toolDef,
        projectDir,
        confirmFn,
      );

      messages.push({
        role: "assistant",
        content: "",
      });
      messages.push({
        role: "tool",
        tool_call_id: result.toolCallId,
        name: result.name,
        content: result.result,
      });
    }
  }

  update({
    result: `${""}\n\n[Max tool iterations reached]`,
  });
}

function accumulateToolCall(
  acc: Map<string, { id: string; name: string; argsBuffer: string }>,
  id: string,
  name: string,
  argsChunk: string,
) {
  let existing = acc.get(id);
  if (!existing) {
    existing = { id, name, argsBuffer: "" };
    acc.set(id, existing);
  }
  existing.argsBuffer += argsChunk;
}
