const STEP_SUGGESTIONS: Record<string, string[]> = {
  discuss: [
    "Let's explore the problem space",
    "What are the tradeoffs here?",
    "Show me the current architecture",
    "What are the constraints?",
    "What are the edge cases?",
  ],
  propose: [
    "Create a proposal for",
    "I want to add",
    "I need to change",
    "The problem is",
    "We should refactor",
  ],
  plan: [
    "Break this down into steps",
    "What files need to change?",
    "What's the impact on the codebase?",
    "What are the dependencies?",
    "List the affected modules",
  ],
  design: [
    "Design the API for",
    "What's the data model?",
    "How should this integrate?",
    "What's the interface?",
    "Sketch the architecture",
  ],
  tasks: [
    "Create tasks for",
    "What's the priority order?",
    "Estimate the effort",
    "Break into subtasks",
    "What can be parallelized?",
  ],
  apply: [
    "Start implementing",
    "Apply the changes",
    "Run the tests",
    "What's left to do?",
    "Verify the implementation",
  ],
  archive: [
    "Archive this change",
    "What did we learn?",
    "Update the documentation",
    "Create a summary",
    "What should we remember?",
  ],
};

export function computeSuggestions(prompt: string, stepId: string): string[] {
  const candidates = STEP_SUGGESTIONS[stepId] ?? STEP_SUGGESTIONS.discuss ?? [];

  if (!prompt) return candidates;

  const lower = prompt.toLowerCase();
  return candidates.filter((s) => s.toLowerCase().startsWith(lower));
}

export function getCurrentStepId(
  steps: { id: string; status: string }[],
): string {
  const current = steps.find((s) => s.status === "current");
  return current?.id ?? "discuss";
}
