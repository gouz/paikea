import type {
  AgentStep,
  AppState,
  Message,
  Step,
  ThinkingState,
} from "../types";

type Listener = () => void;

class Store {
  private state: AppState = {
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
    uiMode: "normal",
    toolbarIndex: 0,
    paletteIndex: 0,
    suggestions: [],
    suggestionIndex: -1,
  };

  private listeners: Listener[] = [];

  get(): AppState {
    return this.state;
  }

  set(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  addMessage(msg: Message) {
    this.state.messages.push(msg);
    this.notify();
  }

  setThinking(thinking: Partial<ThinkingState>) {
    this.state.thinking = { ...this.state.thinking, ...thinking };
    this.notify();
  }

  appendResult(text: string) {
    this.state.result += text;
    this.notify();
  }

  clearResult() {
    this.state.result = "";
    this.notify();
  }

  setSteps(steps: Step[]) {
    this.state.steps = steps;
    this.notify();
  }

  addAgentStep(step: AgentStep) {
    this.state.agentSteps.push(step);
    this.notify();
  }

  updateAgentStep(id: string, update: Partial<AgentStep>) {
    const step = this.state.agentSteps.find((s) => s.id === id);
    if (step) {
      Object.assign(step, update);
      this.notify();
    }
  }

  clearAgentSteps() {
    this.state.agentSteps = [];
    this.notify();
  }
}

export const store = new Store();
