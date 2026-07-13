import { confirm } from "@clack/prompts";
import { renderAgentSteps } from "../../components/agent-steps";
import { renderCommandPalette } from "../../components/command-palette";
import { renderHeader } from "../../components/header";
import { renderPromptInput } from "../../components/prompt-input";
import { renderResultPane } from "../../components/result-pane";
import { renderStatusBar } from "../../components/status-bar";
import { renderThinkingPane } from "../../components/thinking-pane";
import { renderTimeline } from "../../components/timeline";
import { calculateLayout } from "../../renderer/layout";
import {
  cleanupTerminal,
  getEventStream,
  getTerminal,
  initTerminal,
} from "../../renderer/terminal";
import { buildRulesPrompt, loadRules } from "../../rules/registry";
import { streamChat } from "../../services/dmr-client";
import {
  fetchModels,
  nextModel,
  prevModel,
} from "../../services/model-registry";
import { detectOpenSpecSteps } from "../../services/openspec-hook";
import {
  computeSuggestions,
  getCurrentStepId,
} from "../../services/suggestions";
import { hasThinkingSupport } from "../../services/thinking-parser";
import { buildSkillsPrompt, loadSkills } from "../../skills/registry";
import { createSessionId, saveSession } from "../../state/session";
import { store } from "../../state/store";
import { executeTool } from "../../tools/executor";
import { loadTools } from "../../tools/registry";
import type { Action, ToolCall, ToolDefinition } from "../../types";

const MAX_TOOL_ITERATIONS = 10;

export async function startTUI() {
  const term = await initTerminal();
  if (!term) return;

  const stream = getEventStream();
  if (!stream) return;

  const cwd = process.cwd();

  const models = await fetchModels();
  if (models.length === 0) {
    console.error(
      "No models found in Docker Model Runner. Run: docker model pull ai/qwen3",
    );
    await cleanupTerminal();
    return;
  }

  const steps = detectOpenSpecSteps(cwd);
  store.set({
    models,
    model: models[0],
    steps,
  });

  // Initial suggestions
  const stepId = getCurrentStepId(steps);
  const initialSuggestions = computeSuggestions("", stepId);
  store.set({ suggestions: initialSuggestions });

  const skills = loadSkills(cwd);
  const rules = loadRules();
  const tools = loadTools(cwd);
  const systemPrompt = buildSkillsPrompt(skills) + buildRulesPrompt(rules);

  let prompt = "";
  let cursorPos = 0;
  const sessionId = createSessionId();

  let quitting = false;
  async function quit() {
    if (quitting) return;
    quitting = true;
    streamAbort?.abort();
    await cleanupTerminal();
    process.exit(0);
  }

  // Controls the in-flight generation so it can be cancelled from the keyboard.
  let streamAbort: AbortController | null = null;
  function cancelStreaming(): boolean {
    if (!store.get().streaming) return false;
    streamAbort?.abort();
    return true;
  }

  // Actions for palette and toolbar
  const actions: Action[] = [
    {
      id: "model",
      label: "Switch Model",
      shortcut: "Tab",
      action: () => {
        const newModel = nextModel();
        if (newModel) {
          store.set({ model: newModel, steps: detectOpenSpecSteps(cwd) });
        }
      },
    },
    {
      id: "thinking",
      label: "Toggle Thinking",
      shortcut: "",
      action: () =>
        store.set({ thinkingVisible: !store.get().thinkingVisible }),
    },
    {
      id: "clear",
      label: "Clear",
      shortcut: "",
      action: () => {
        store.clearResult();
        store.setThinking({ active: false, content: "", tokens: 0 });
        store.clearAgentSteps();
        store.set({ scrollOffset: 0 });
      },
    },
    {
      id: "quit",
      label: "Quit",
      shortcut: "Esc",
      action: () => {
        void quit();
      },
    },
  ];

  function drawUI() {
    const s = store.get();
    const { rows, cols } = term;
    const layout = calculateLayout(
      rows,
      cols,
      s.thinkingVisible,
      s.agentSteps.length,
    );

    renderHeader(term, layout, s.model?.name ?? "none");
    renderTimeline(term, layout, s.steps);
    renderThinkingPane(term, layout, s.thinking.content, s.thinkingVisible);
    renderAgentSteps(term, layout, s.agentSteps);
    renderResultPane(term, layout, s.result, s.scrollOffset);
    renderPromptInput(
      term,
      layout,
      prompt,
      cursorPos,
      s.uiMode === "normal",
      s.suggestions,
      s.suggestionIndex,
    );
    renderStatusBar(
      term,
      layout,
      s.model?.name ?? "none",
      s.thinking.tokens,
      s.streaming,
      s.toolbarIndex,
      s.uiMode === "toolbar",
    );

    // Render command palette on top
    if (s.uiMode === "palette") {
      renderCommandPalette(term, actions, s.paletteIndex, rows, cols);
    }

    term.render();
  }

  async function confirmDestructive(message: string): Promise<boolean> {
    const result = await confirm({ message });
    return result === true;
  }

  async function handleSubmit() {
    if (!prompt.trim() || !store.get().model || store.get().streaming) return;

    const userPrompt = prompt;
    prompt = "";
    cursorPos = 0;

    store.addMessage({
      role: "user",
      content: userPrompt,
      timestamp: Date.now(),
    });
    store.set({
      streaming: true,
      result: "",
      agentSteps: [],
      suggestions: [],
      scrollOffset: 0,
    });

    const model = store.get().model;
    if (!model) return;
    const useThinking = hasThinkingSupport(model.id);

    const messages: {
      role: string;
      content: string;
      tool_call_id?: string;
      name?: string;
    }[] = [{ role: "system", content: systemPrompt }];

    for (const msg of store.get().messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    streamAbort = new AbortController();
    try {
      await runAgentLoop(
        messages,
        model.id,
        useThinking,
        tools,
        cwd,
        drawUI,
        confirmDestructive,
        streamAbort.signal,
      );
    } catch (err) {
      // A user-initiated cancel aborts the fetch; keep whatever streamed so far.
      if (streamAbort.signal.aborted) {
        store.set({
          result: `${store.get().result}\n\n[Generation cancelled]`,
        });
      } else {
        store.set({ result: `Error: ${err}` });
      }
    } finally {
      streamAbort = null;
    }

    const finalResult = store.get().result;
    store.addMessage({
      role: "assistant",
      content: finalResult,
      timestamp: Date.now(),
    });

    store.set({ streaming: false });

    // Sync OpenSpec to vault
    try {
      const { syncOpenSpecToVault } = await import(
        "../../services/openspec-sync"
      );
      syncOpenSpecToVault(cwd);
    } catch {
      // Silent fail — vault sync is best-effort
    }

    saveSession({
      id: sessionId,
      date: new Date().toISOString().split("T")[0] ?? new Date().toISOString(),
      model: model.name,
      messages: store.get().messages,
    });

    drawUI();
  }

  function executeAction(action: Action | undefined) {
    if (!action) return;
    action.action();
    store.set({ uiMode: "normal" });
    drawUI();
  }

  (async () => {
    for await (const event of stream) {
      if (event.type === "key") {
        const { code, modifiers } = event;
        const s = store.get();

        // Ctrl+C / Ctrl+D: cancel an in-flight generation first, otherwise
        // quit. Raw mode means these never arrive as SIGINT, so we handle the
        // bytes ourselves.
        if (
          modifiers.ctrl &&
          typeof code === "object" &&
          (code.char === "c" || code.char === "d")
        ) {
          if (cancelStreaming()) {
            drawUI();
            continue;
          }
          await quit();
          continue;
        }

        // Palette mode
        if (s.uiMode === "palette") {
          if (code === "Escape") {
            store.set({ uiMode: "normal" });
            drawUI();
            continue;
          }
          if (code === "Up") {
            store.set({
              paletteIndex: Math.max(0, s.paletteIndex - 1),
            });
            drawUI();
            continue;
          }
          if (code === "Down") {
            store.set({
              paletteIndex: Math.min(actions.length - 1, s.paletteIndex + 1),
            });
            drawUI();
            continue;
          }
          if (code === "Enter") {
            executeAction(actions[s.paletteIndex]);
            continue;
          }
          continue;
        }

        // Toolbar mode
        if (s.uiMode === "toolbar") {
          if (code === "Escape") {
            store.set({ uiMode: "normal" });
            drawUI();
            continue;
          }
          if (code === "Tab") {
            store.set({
              toolbarIndex: (s.toolbarIndex + 1) % 4,
            });
            drawUI();
            continue;
          }
          if (code === "Enter") {
            // Execute toolbar action by index
            const toolbarActions = [
              actions[0], // Model
              actions[1], // Thinking
              actions[2], // Clear
              actions[3], // Quit (palette)
            ];
            if (s.toolbarIndex === 3) {
              // Palette button opens palette
              store.set({ uiMode: "palette", toolbarIndex: 0 });
            } else {
              executeAction(toolbarActions[s.toolbarIndex]);
            }
            drawUI();
            continue;
          }
          continue;
        }

        // Normal mode
        if (code === "Escape") {
          // Escape cancels a running generation, or quits when idle.
          if (cancelStreaming()) {
            drawUI();
            continue;
          }
          await quit();
          continue;
        }

        // Enter to submit (only when prompt is focused and not already busy).
        // Launched detached so the event loop stays responsive while streaming,
        // which is what lets Escape / Ctrl+C cancel mid-generation.
        if (
          code === "Enter" &&
          !modifiers.ctrl &&
          !modifiers.alt &&
          s.uiMode === "normal"
        ) {
          if (!s.streaming) {
            void handleSubmit();
          }
          drawUI();
          continue;
        }

        // Scroll the response pane.
        if (code === "PageUp" || (code === "Up" && modifiers.shift)) {
          store.set({ scrollOffset: Math.max(0, s.scrollOffset - 5) });
          drawUI();
          continue;
        }
        if (code === "PageDown" || (code === "Down" && modifiers.shift)) {
          store.set({ scrollOffset: s.scrollOffset + 5 });
          drawUI();
          continue;
        }

        // Shift+Tab cycles to the previous model.
        if (code === "Tab" && modifiers.shift) {
          const newModel = prevModel();
          if (newModel) {
            store.set({ model: newModel, steps: detectOpenSpecSteps(cwd) });
          }
          drawUI();
          continue;
        }

        // Tab to accept suggestion or next model
        if (code === "Tab" && !modifiers.shift) {
          const s2 = store.get();
          if (s2.suggestions.length > 0 && s2.uiMode === "normal") {
            // Accept suggestion
            const idx = s2.suggestionIndex >= 0 ? s2.suggestionIndex : 0;
            const suggestion = s2.suggestions[idx];
            if (suggestion) {
              prompt = suggestion;
              cursorPos = prompt.length;
            }
          } else {
            const newModel = nextModel();
            if (newModel) {
              store.set({ model: newModel, steps: detectOpenSpecSteps(cwd) });
            }
          }
          drawUI();
          continue;
        }

        // : to open palette
        if (typeof code === "object" && code.char === ":") {
          store.set({ uiMode: "palette", paletteIndex: 0 });
          drawUI();
          continue;
        }

        // Arrow keys for toolbar navigation
        if (code === "Left") {
          if (s.uiMode === "normal") {
            cursorPos = Math.max(0, cursorPos - 1);
          }
          drawUI();
          continue;
        }
        if (code === "Right") {
          if (s.uiMode === "normal") {
            cursorPos = Math.min(prompt.length, cursorPos + 1);
          }
          drawUI();
          continue;
        }

        // Cursor up/down to enter toolbar mode
        if (code === "Up") {
          store.set({ uiMode: "toolbar", toolbarIndex: 0 });
          drawUI();
          continue;
        }
        if (code === "Down") {
          // Down exits toolbar back to prompt
          store.set({ uiMode: "normal" });
          drawUI();
          continue;
        }

        // Prompt editing (only in normal mode)
        if (s.uiMode === "normal") {
          let promptChanged = false;
          if (code === "Backspace") {
            prompt = prompt.slice(0, cursorPos - 1) + prompt.slice(cursorPos);
            cursorPos = Math.max(0, cursorPos - 1);
            promptChanged = true;
          } else if (code === "Delete") {
            prompt = prompt.slice(0, cursorPos) + prompt.slice(cursorPos + 1);
            promptChanged = true;
          } else if (
            code === "Home" ||
            (modifiers.ctrl && typeof code === "object" && code.char === "a")
          ) {
            cursorPos = 0;
          } else if (
            code === "End" ||
            (modifiers.ctrl && typeof code === "object" && code.char === "e")
          ) {
            cursorPos = prompt.length;
          } else if (
            modifiers.ctrl &&
            typeof code === "object" &&
            code.char === "u"
          ) {
            // Kill from cursor to line start
            prompt = prompt.slice(cursorPos);
            cursorPos = 0;
            promptChanged = true;
          } else if (
            modifiers.ctrl &&
            typeof code === "object" &&
            code.char === "w"
          ) {
            // Kill the word before the cursor
            const before = prompt.slice(0, cursorPos);
            const trimmed = before.replace(/\s*\S+\s*$/, "");
            prompt = trimmed + prompt.slice(cursorPos);
            cursorPos = trimmed.length;
            promptChanged = true;
          } else if (
            typeof code === "object" &&
            code.char &&
            !modifiers.ctrl &&
            !modifiers.alt
          ) {
            prompt =
              prompt.slice(0, cursorPos) + code.char + prompt.slice(cursorPos);
            cursorPos += code.char.length;
            promptChanged = true;
          }

          // Recompute suggestions on prompt change
          if (promptChanged) {
            const stepId = getCurrentStepId(s.steps);
            const suggestions = computeSuggestions(prompt, stepId);
            store.set({ suggestions, suggestionIndex: -1 });
          }
        }

        drawUI();
      }
    }
  })();

  // Redraw on terminal resize so the layout tracks the new dimensions.
  getTerminal()?.on("resize", () => drawUI());

  drawUI();

  process.on("SIGINT", () => {
    void quit();
  });

  process.on("SIGTERM", () => {
    void quit();
  });
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
  drawUI: () => void,
  confirmFn: (message: string) => Promise<boolean>,
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

    if (useThinking) {
      for await (const chunk of streamChat(messages, modelId, tools, signal)) {
        if (chunk.type === "thinking") {
          thinkingContent += chunk.text;
          store.setThinking({
            content: thinkingContent,
            tokens: thinkingContent.length,
          });
        } else if (chunk.type === "content") {
          resultContent += chunk.text;
          store.set({ result: resultContent });
        } else if (chunk.type === "tool_call") {
          accumulateToolCall(
            toolCallsByName,
            chunk.id,
            chunk.name,
            chunk.arguments,
          );
        }
        drawUI();
      }
    } else {
      for await (const chunk of streamChat(messages, modelId, tools, signal)) {
        if (chunk.type === "content") {
          resultContent += chunk.text;
          store.set({ result: resultContent });
        } else if (chunk.type === "tool_call") {
          accumulateToolCall(
            toolCallsByName,
            chunk.id,
            chunk.name,
            chunk.arguments,
          );
        }
        drawUI();
      }
    }

    // No tool calls → done
    if (toolCallsByName.size === 0) {
      store.set({ result: resultContent });
      return;
    }

    // Execute each tool call
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

      // Register agent step
      const stepId = `step_${Date.now()}_${acc.id}`;
      store.addAgentStep({
        id: stepId,
        type: "tool_call",
        name: acc.name,
        arguments: args,
        status: "running",
        timestamp: Date.now(),
      });
      drawUI();

      // Find tool definition
      const toolDef = tools.find((t) => t.name === acc.name);
      if (!toolDef) {
        store.updateAgentStep(stepId, {
          status: "error",
          content: `Unknown tool: ${acc.name}`,
        });
        continue;
      }

      // Execute
      const result = await executeTool(
        toolCall,
        toolDef,
        projectDir,
        confirmFn,
      );

      // Update step with result
      store.updateAgentStep(stepId, {
        type: "tool_result",
        content: result.success ? result.result : `Error: ${result.result}`,
        status: result.success ? "done" : "error",
      });
      drawUI();

      // Feed result back to messages
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

    // Clear agent steps after a short delay concept — keep them visible
    // They'll be cleared on next user message
  }

  store.set({
    result: `${store.get().result}\n\n[Max tool iterations reached]`,
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
