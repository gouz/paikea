import { beforeEach, describe, expect, it } from "bun:test";
import { store } from "../state/store";
import type { AgentStep } from "../types";

describe("Store", () => {
  beforeEach(() => {
    store.set({
      model: null,
      models: [],
      messages: [],
      steps: [],
      thinking: { active: false, content: "", tokens: 0 },
      result: "",
      prompt: "",
      scrollOffset: 0,
      thinkingVisible: true,
      streaming: false,
      agentSteps: [],
      toolCallsStreaming: new Map(),
    });
  });

  it("should return initial state", () => {
    const state = store.get();
    expect(state.model).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.result).toBe("");
  });

  it("should update state with set()", () => {
    store.set({ result: "hello" });
    expect(store.get().result).toBe("hello");
  });

  it("should add messages", () => {
    store.addMessage({ role: "user", content: "test", timestamp: 123 });
    expect(store.get().messages).toHaveLength(1);
    expect(store.get().messages[0]?.content).toBe("test");
  });

  it("should set thinking partially", () => {
    store.setThinking({ content: "thinking..." });
    expect(store.get().thinking.content).toBe("thinking...");
    expect(store.get().thinking.tokens).toBe(0);
  });

  it("should append result", () => {
    store.set({ result: "hello" });
    store.appendResult(" world");
    expect(store.get().result).toBe("hello world");
  });

  it("should clear result", () => {
    store.set({ result: "hello" });
    store.clearResult();
    expect(store.get().result).toBe("");
  });

  it("should set steps", () => {
    const steps = [{ id: "1", name: "Step 1", status: "done" as const }];
    store.setSteps(steps);
    expect(store.get().steps).toEqual(steps);
  });

  it("should notify listeners on state change", () => {
    let notified = false;
    store.subscribe(() => {
      notified = true;
    });
    store.set({ result: "test" });
    expect(notified).toBe(true);
  });

  it("should unsubscribe listeners", () => {
    let count = 0;
    const unsub = store.subscribe(() => {
      count++;
    });
    store.set({ result: "a" });
    unsub();
    store.set({ result: "b" });
    expect(count).toBe(1);
  });

  it("should add agent steps", () => {
    const step: AgentStep = {
      id: "s1",
      type: "tool_call",
      name: "web_search",
      status: "running",
      timestamp: Date.now(),
    };
    store.addAgentStep(step);
    expect(store.get().agentSteps).toHaveLength(1);
    expect(store.get().agentSteps[0]?.name).toBe("web_search");
  });

  it("should update agent steps", () => {
    const step: AgentStep = {
      id: "s1",
      type: "tool_call",
      name: "web_search",
      status: "running",
      timestamp: Date.now(),
    };
    store.addAgentStep(step);
    store.updateAgentStep("s1", { status: "done", content: "Found 5 results" });
    expect(store.get().agentSteps[0]?.status).toBe("done");
    expect(store.get().agentSteps[0]?.content).toBe("Found 5 results");
  });

  it("should clear agent steps", () => {
    store.addAgentStep({
      id: "s1",
      type: "tool_call",
      name: "web_search",
      status: "running",
      timestamp: Date.now(),
    });
    store.clearAgentSteps();
    expect(store.get().agentSteps).toHaveLength(0);
  });
});
