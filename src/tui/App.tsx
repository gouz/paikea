import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildRulesPrompt, loadRules } from "../rules/registry";
import { streamChat } from "../services/dmr-client";
import { fetchModels, nextModel, prevModel } from "../services/model-registry";
import {
  buildStepPrompt,
  detectOpenSpecSteps,
} from "../services/openspec-hook";
import {
  computeStepCommands,
  computeSuggestions,
  matchStepCommand,
} from "../services/suggestions";
import { hasThinkingSupport } from "../services/thinking-parser";
import {
  buildSkillsPrompt,
  filterSkillsForStep,
  loadSkills,
  type Skill,
} from "../skills/registry";
import {
  getSavedTheme,
  getThinkingEnabled,
  saveTheme,
  saveThinkingEnabled,
} from "../state/config";
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

function stepIdAt(steps: Step[], index: number): string {
  return steps[index]?.id ?? "discuss";
}

// Suggestions are step-command completions ("/apply") when the prompt starts
// with a slash, otherwise the free-form prompt starters for the active step.
function computePromptSuggestions(
  text: string,
  stepId: string,
  steps: Step[],
): string[] {
  if (text.startsWith("/")) {
    return computeStepCommands(
      text,
      steps.map((s) => s.id),
    );
  }
  return computeSuggestions(text, stepId);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// The thinking pane is on screen when it is enabled and there is either
// captured reasoning or a live thinking stream in progress.
function isThinkingShown(s: AppState): boolean {
  return (
    s.thinkingVisible &&
    (s.thinking.content !== "" || (s.streaming && s.thinking.active))
  );
}

type UIMode = "normal" | "palette";

interface AppState {
  model: Model | null;
  models: Model[];
  messages: Message[];
  steps: Step[];
  thinking: { active: boolean; content: string; tokens: number };
  result: string;
  scrollOffset: number;
  thinkingScrollOffset: number;
  scrollFocus: "thinking" | "response";
  thinkingVisible: boolean;
  thinkingEnabled: boolean;
  streaming: boolean;
  agentSteps: AgentStep[];
  uiMode: UIMode;
  paletteIndex: number;
  suggestions: string[];
  suggestionIndex: number;
  confirmQuit: boolean;
  selectedStepIndex: number;
  themeTick: number;
}

export function App() {
  const { exit } = useApp();

  const [state, setState] = useState<AppState>({
    model: null,
    models: [],
    messages: [],
    steps: [],
    thinking: { active: false, content: "", tokens: 0 },
    result: "",
    scrollOffset: 0,
    thinkingScrollOffset: 0,
    scrollFocus: "response",
    thinkingVisible: true,
    thinkingEnabled: false,
    streaming: false,
    agentSteps: [],
    uiMode: "normal",
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
  const skillsRef = useRef<Skill[]>([]);
  const rulesPromptRef = useRef("");
  const toolsRef = useRef<ToolDefinition[]>([]);

  // Initialize
  useEffect(() => {
    async function init() {
      const savedTheme = getSavedTheme();
      setThemeByName(savedTheme);
      const thinkingEnabled = getThinkingEnabled();

      const models = await fetchModels();
      if (models.length === 0) {
        console.error(
          "No models found in Docker Model Runner. Run: docker model pull ai/qwen3",
        );
        exit();
        return;
      }

      const steps = detectOpenSpecSteps(cwd.current);
      // Select the filesystem-detected current step by default
      const currentIdx = Math.max(
        0,
        steps.findIndex((st) => st.status === "current"),
      );
      const initialSuggestions = computeSuggestions(
        "",
        stepIdAt(steps, currentIdx),
      );

      skillsRef.current = loadSkills(cwd.current);
      rulesPromptRef.current = buildRulesPrompt(loadRules());
      toolsRef.current = loadTools(cwd.current);

      setState((s) => ({
        ...s,
        models,
        model: models[0] ?? null,
        steps,
        selectedStepIndex: currentIdx,
        suggestions: initialSuggestions,
        thinkingEnabled,
      }));
    }
    void init();
  }, [exit]);

  const update = useCallback((partial: Partial<AppState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || !state.model || state.streaming) return;

    // A "/step" command switches the workflow step instead of prompting the LLM
    const cmdStep = matchStepCommand(
      prompt,
      state.steps.map((s) => s.id),
    );
    if (cmdStep) {
      const idx = state.steps.findIndex((s) => s.id === cmdStep);
      setPrompt("");
      setCursorPos(0);
      update({
        selectedStepIndex: Math.max(0, idx),
        suggestions: computeSuggestions("", cmdStep),
        suggestionIndex: -1,
      });
      return;
    }

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
      thinking: { active: false, content: "", tokens: 0 },
      agentSteps: [],
      suggestions: [],
      scrollOffset: 0,
      thinkingScrollOffset: 0,
      scrollFocus: "response",
      messages: [...state.messages, userMessage],
    });

    const model = state.model;
    if (!model) return;
    const modelSupportsThinking = hasThinkingSupport(model.id);
    const useThinking = modelSupportsThinking && state.thinkingEnabled;
    const disableThinking = modelSupportsThinking && !state.thinkingEnabled;

    // Build the system prompt for the active step: only matching openspec
    // skills are injected, plus step-specific workflow guidance
    const stepId = stepIdAt(state.steps, state.selectedStepIndex);
    const systemPrompt =
      buildSkillsPrompt(filterSkillsForStep(skillsRef.current, stepId)) +
      rulesPromptRef.current +
      buildStepPrompt(stepId);

    const messages: {
      role: string;
      content: string;
      tool_call_id?: string;
      name?: string;
    }[] = [{ role: "system", content: systemPrompt }];

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
        disableThinking,
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

      // The turn may have created or advanced an OpenSpec change: refresh the
      // frise, keeping the user's manual selection (clamped to the new length).
      const steps = detectOpenSpecSteps(cwd.current);
      const selectedStepIndex = Math.min(
        s.selectedStepIndex,
        Math.max(0, steps.length - 1),
      );

      return {
        ...s,
        streaming: false,
        messages: newMessages,
        steps,
        selectedStepIndex,
      };
    });
  }, [
    prompt,
    state.model,
    state.streaming,
    state.messages,
    state.result,
    state.steps,
    state.selectedStepIndex,
    state.thinkingEnabled,
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

  const selectStep = useCallback(
    (index: number) => {
      setState((s) => {
        const clamped = Math.max(0, Math.min(s.steps.length - 1, index));
        return {
          ...s,
          selectedStepIndex: clamped,
          suggestions: computePromptSuggestions(
            prompt,
            stepIdAt(s.steps, clamped),
            s.steps,
          ),
          suggestionIndex: -1,
        };
      });
    },
    [prompt],
  );

  // Actions for palette
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
        if (newModel) update({ model: newModel });
      },
    },
    {
      id: "refresh-steps",
      label: "Refresh Workflow",
      shortcut: "",
      action: () => {
        const steps = detectOpenSpecSteps(cwd.current);
        update({
          steps,
          selectedStepIndex: Math.min(
            state.selectedStepIndex,
            Math.max(0, steps.length - 1),
          ),
        });
      },
    },
    {
      id: "thinking-mode",
      label: `Model Thinking: ${state.thinkingEnabled ? "on" : "off"}`,
      shortcut: "",
      action: () => {
        const enabled = !state.thinkingEnabled;
        saveThinkingEnabled(enabled);
        update({ thinkingEnabled: enabled });
      },
    },
    {
      id: "thinking",
      label: "Toggle Thinking Pane",
      shortcut: "",
      action: () => update({ thinkingVisible: !state.thinkingVisible }),
    },
    {
      id: "step-prev",
      label: "Step: Previous",
      shortcut: "alt+←",
      action: () => selectStep(state.selectedStepIndex - 1),
    },
    {
      id: "step-next",
      label: "Step: Next",
      shortcut: "alt+→",
      action: () => selectStep(state.selectedStepIndex + 1),
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
          thinkingScrollOffset: 0,
          scrollFocus: "response",
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

    // Scroll focus: the thinking pane is only a scroll target when on screen.
    const thinkingShown = isThinkingShown(s);
    const focus = thinkingShown ? s.scrollFocus : "response";

    // Ctrl+T — move the scroll focus between the thinking and response panes
    if (key.ctrl && input === "t") {
      if (thinkingShown) {
        update({
          scrollFocus: s.scrollFocus === "thinking" ? "response" : "thinking",
        });
      }
      return;
    }

    // Scroll the focused pane — offset counts from the bottom (0 = follow tail)
    const scrollBy = (delta: number) => {
      if (focus === "thinking") {
        const lineCount = s.thinking.content
          ? s.thinking.content.split("\n").length
          : 0;
        update({
          thinkingScrollOffset: clamp(
            s.thinkingScrollOffset + delta,
            0,
            lineCount,
          ),
        });
      } else {
        const lineCount = s.result ? s.result.split("\n").length : 0;
        update({ scrollOffset: clamp(s.scrollOffset + delta, 0, lineCount) });
      }
    };
    if (key.pageUp || (key.upArrow && key.shift)) {
      scrollBy(5);
      return;
    }
    if (key.pageDown || (key.downArrow && key.shift)) {
      scrollBy(-5);
      return;
    }
    if (key.upArrow) {
      scrollBy(1);
      return;
    }
    if (key.downArrow) {
      scrollBy(-1);
      return;
    }

    // Shift+Tab = previous model
    if (key.tab && key.shift) {
      const newModel = prevModel();
      if (newModel) update({ model: newModel });
      return;
    }

    // Tab = accept suggestion, or next model when there is none
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
        if (newModel) update({ model: newModel });
      }
      return;
    }

    // Ctrl+P to open palette
    if (key.ctrl && input === "p") {
      update({ uiMode: "palette", paletteIndex: 0 });
      return;
    }

    // Alt+←/→ — navigate workflow steps
    if (key.meta && key.leftArrow) {
      selectStep(s.selectedStepIndex - 1);
      return;
    }
    if (key.meta && key.rightArrow) {
      selectStep(s.selectedStepIndex + 1);
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

    // Prompt editing
    if (key.backspace) {
      const next = prompt.slice(0, cursorPos - 1) + prompt.slice(cursorPos);
      setPrompt(next);
      setCursorPos((p) => Math.max(0, p - 1));
      const stepId = stepIdAt(s.steps, s.selectedStepIndex);
      const suggestions = computePromptSuggestions(next, stepId, s.steps);
      update({ suggestions, suggestionIndex: -1 });
      return;
    }
    if (key.delete) {
      const next = prompt.slice(0, cursorPos) + prompt.slice(cursorPos + 1);
      setPrompt(next);
      const stepId = stepIdAt(s.steps, s.selectedStepIndex);
      const suggestions = computePromptSuggestions(next, stepId, s.steps);
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
      const next = prompt.slice(0, cursorPos) + input + prompt.slice(cursorPos);
      setPrompt(next);
      setCursorPos((p) => p + input.length);
      const stepId = stepIdAt(s.steps, s.selectedStepIndex);
      const suggestions = computePromptSuggestions(next, stepId, s.steps);
      update({ suggestions, suggestionIndex: -1 });
    }
  });

  const thinkingActive = state.streaming && state.thinking.active;
  const showThinking = isThinkingShown(state);
  const showAgent = state.agentSteps.length > 0;
  const scrollFocus = showThinking ? state.scrollFocus : "response";
  const layout = useLayout({ showThinking, showAgent });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Header model={state.model} modelCount={state.models.length} />
      <Timeline steps={state.steps} selectedIndex={state.selectedStepIndex} />
      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        <ThinkingPane
          content={state.thinking.content}
          active={thinkingActive}
          visible={showThinking}
          maxHeight={layout.thinkingMax}
          scrollOffset={state.thinkingScrollOffset}
          focused={scrollFocus === "thinking"}
        />
        <AgentSteps steps={state.agentSteps} maxHeight={layout.agentMax} />
        <ResultPane
          content={state.result}
          scrollOffset={state.scrollOffset}
          maxHeight={layout.resultHeight}
          streaming={state.streaming}
          hasHistory={state.messages.length > 0}
          focused={scrollFocus === "response"}
        />
      </Box>
      <PromptInput
        prompt={prompt}
        cursorPos={cursorPos}
        focused={state.uiMode === "normal"}
        suggestions={state.suggestions}
        suggestionIndex={state.suggestionIndex}
        disabled={state.streaming}
      />
      <StatusBar
        model={state.model}
        stepName={state.steps[state.selectedStepIndex]?.name ?? null}
        tokens={state.thinking.tokens}
        streaming={state.streaming}
        confirmQuit={state.confirmQuit}
        canFocusPanes={showThinking}
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
  disableThinking?: boolean,
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

    const stream = streamChat(
      messages,
      modelId,
      tools,
      signal,
      disableThinking,
    );

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
