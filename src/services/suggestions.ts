const STEP_SUGGESTIONS: Record<string, string[]> = {
  discuss: [
    "Let's explore the problem space",
    "What are the tradeoffs here?",
    "Show me the current architecture",
    "What are the constraints?",
    "What are the edge cases?",
  ],
  proposal: [
    "Create a proposal for",
    "I want to add",
    "I need to change",
    "The problem is",
    "We should refactor",
  ],
  design: [
    "Design the API for",
    "What's the data model?",
    "How should this integrate?",
    "What's the interface?",
    "Sketch the architecture",
  ],
  specs: [
    "Write the spec for",
    "What are the requirements?",
    "Define the behavior of",
    "What are the acceptance criteria?",
    "Validate the spec",
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

// Slash-command autocompletions for switching workflow steps, e.g. typing
// "/pro" suggests ["/proposal"]. Driven by the live frise so the commands
// always match the steps actually on screen.
export function computeStepCommands(
  prompt: string,
  stepIds: string[],
): string[] {
  const lower = prompt.toLowerCase();
  return stepIds.map((id) => `/${id}`).filter((cmd) => cmd.startsWith(lower));
}

// Natural-language shorthands that aren't a prefix of the canonical step id.
const STEP_ALIASES: Record<string, string> = { propose: "proposal" };

// Resolve a prompt like "/apply" (an alias like "/propose", or a unique prefix
// like "/pro") to a step id, or null when it isn't a step command, the alias
// doesn't apply, or the prefix is ambiguous.
export function matchStepCommand(
  prompt: string,
  stepIds: string[],
): string | null {
  const trimmed = prompt.trim().toLowerCase();
  if (!trimmed.startsWith("/")) return null;
  const query = trimmed.slice(1);
  if (!query) return null;
  if (stepIds.includes(query)) return query;
  const alias = STEP_ALIASES[query];
  if (alias && stepIds.includes(alias)) return alias;
  const matches = stepIds.filter((id) => id.startsWith(query));
  return matches.length === 1 ? (matches[0] ?? null) : null;
}
