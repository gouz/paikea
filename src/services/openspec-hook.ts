import { execSync } from "node:child_process";
import type { Step } from "../types";

// The workflow always opens with a non-OpenSpec "discuss" step (free-form
// exploration). The remaining steps mirror the real OpenSpec lifecycle: the
// per-change artifacts reported by `openspec status`, then implementation
// (apply) and archival.
const DISCUSS_STEP = "discuss";
const POST_ARTIFACT_STEPS = ["apply", "archive"] as const;

// Fallback artifact order used only when no active change exists yet, so the
// frise can still show the workflow ahead. The real order comes from the CLI.
const DEFAULT_ARTIFACTS = ["proposal", "design", "specs", "tasks"];

const STEP_NAMES: Record<string, string> = {
  discuss: "Discuss",
  proposal: "Proposal",
  design: "Design",
  specs: "Specs",
  tasks: "Tasks",
  apply: "Apply",
  archive: "Archive",
};

const STEP_GUIDANCE: Record<string, string> = {
  discuss:
    "Free-form discussion. Explore the problem space with the user — constraints, tradeoffs, prior art, edge cases. Do NOT create any OpenSpec artifacts or run any openspec commands yet.",
  proposal:
    "Create an OpenSpec change: run `openspec new change <kebab-case-name>`, then write its `proposal.md` (Why / What Changes / Impact).",
  design:
    "Write the technical design in the change's `design.md`: architecture, data model, API, integration points, alternatives considered.",
  specs:
    "Write the spec deltas under the change's `specs/<domain>/spec.md` — the requirements this change adds or modifies. Run `openspec validate <name>` to check them.",
  tasks:
    "Break the change into an ordered checklist in its `tasks.md` (`- [ ]` items, grouped, parallelizable work flagged).",
  apply:
    "Implement the tasks from the change's `tasks.md`, checking them off (`- [x]`) as you complete them. Validate with `openspec validate <name>`.",
  archive:
    "The change is complete: archive it with `openspec archive <name> --yes`, which merges its spec deltas into `openspec/specs/`. Summarize what was learned.",
};

export function buildStepPrompt(stepId: string): string {
  const guidance = STEP_GUIDANCE[stepId];
  if (!guidance) return "";
  return `\n## Workflow\n\nActive step: **${stepId}**. ${guidance}\n`;
}

function stepName(id: string): string {
  return STEP_NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

interface ChangeSummary {
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastModified: string;
  status: string;
}

interface ArtifactStatus {
  id: string;
  status: string;
}

function runOpenSpecJson<T>(args: string[], cwd: string): T | null {
  try {
    const out = execSync(`openspec ${args.join(" ")}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
    return JSON.parse(out) as T;
  } catch {
    // CLI missing, not an OpenSpec project, or malformed output
    return null;
  }
}

// The change currently being worked on: the most recently modified in-progress
// change, or failing that the most recently modified change overall.
function pickActiveChange(changes: ChangeSummary[]): ChangeSummary | null {
  if (changes.length === 0) return null;
  const byRecency = [...changes].sort((a, b) =>
    b.lastModified.localeCompare(a.lastModified),
  );
  return (
    byRecency.find((c) => c.status !== "complete" && c.status !== "archived") ??
    byRecency[0] ??
    null
  );
}

// Each step keeps its true done/not-done state (OpenSpec artifacts aren't
// strictly sequential — tasks.md may exist before specs). The *earliest*
// not-done step is highlighted as "current" (what to work on next); any later
// not-done steps are "pending".
function sequenceSteps(ids: string[], isDone: (id: string) => boolean): Step[] {
  let foundCurrent = false;
  return ids.map((id) => {
    let status: Step["status"];
    if (isDone(id)) {
      status = "done";
    } else if (!foundCurrent) {
      status = "current";
      foundCurrent = true;
    } else {
      status = "pending";
    }
    return { id, name: stepName(id), status };
  });
}

export function detectOpenSpecSteps(projectDir: string): Step[] {
  const discussOnly: Step[] = [
    { id: DISCUSS_STEP, name: stepName(DISCUSS_STEP), status: "current" },
  ];

  const list = runOpenSpecJson<{ changes: ChangeSummary[] }>(
    ["list", "--json"],
    projectDir,
  );
  // No CLI or not an OpenSpec project: chat-only, just the discuss step.
  if (!list) return discussOnly;

  const active = pickActiveChange(list.changes);

  // OpenSpec project but no active change yet: discuss is current, the rest of
  // the workflow shows ahead as pending.
  if (!active) {
    const ids = [DISCUSS_STEP, ...DEFAULT_ARTIFACTS, ...POST_ARTIFACT_STEPS];
    return sequenceSteps(ids, () => false);
  }

  const status = runOpenSpecJson<{ artifacts: ArtifactStatus[] }>(
    ["status", "--change", active.name, "--json"],
    projectDir,
  );
  const artifacts = status?.artifacts ?? [];
  const artifactIds =
    artifacts.length > 0 ? artifacts.map((a) => a.id) : DEFAULT_ARTIFACTS;
  const artifactDone = new Map(
    artifacts.map((a) => [a.id, a.status === "done"]),
  );

  const tasksImplemented =
    active.totalTasks > 0 && active.completedTasks >= active.totalTasks;

  const ids = [DISCUSS_STEP, ...artifactIds, ...POST_ARTIFACT_STEPS];
  return sequenceSteps(ids, (id) => {
    if (id === DISCUSS_STEP) return true; // a change exists, discussion is past
    if (id === "apply") return tasksImplemented;
    if (id === "archive") return false; // archived changes drop off the list
    return artifactDone.get(id) ?? false;
  });
}
