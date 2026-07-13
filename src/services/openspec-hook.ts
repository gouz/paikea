import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Step } from "../types";

const WORKFLOW_STEPS = [
  { id: "discuss", name: "Discuss" },
  { id: "propose", name: "Propose" },
  { id: "plan", name: "Plan" },
  { id: "design", name: "Design" },
  { id: "tasks", name: "Tasks" },
  { id: "apply", name: "Apply" },
  { id: "archive", name: "Archive" },
];

export function detectOpenSpecSteps(projectDir: string): Step[] {
  const changesDir = join(projectDir, "openspec", "changes");

  if (!existsSync(changesDir)) {
    return WORKFLOW_STEPS.map((s, i) => ({
      ...s,
      status: (i === 0 ? "current" : "pending") as Step["status"],
    }));
  }

  const changes = readdirSync(changesDir).filter((f) => !f.startsWith("."));
  if (changes.length === 0) {
    return WORKFLOW_STEPS.map((s, i) => ({
      ...s,
      status: (i === 0 ? "current" : "pending") as Step["status"],
    }));
  }

  const latestChange = join(changesDir, changes[changes.length - 1] ?? "");
  const hasProposal = existsSync(join(latestChange, "proposal.md"));
  const hasSpecs = existsSync(join(latestChange, "specs"));
  const hasDesign = existsSync(join(latestChange, "design.md"));
  const hasTasks = existsSync(join(latestChange, "tasks.md"));

  return [
    {
      id: "discuss",
      name: "Discuss",
      status: hasProposal ? "done" : "current",
    },
    {
      id: "propose",
      name: "Propose",
      status: hasProposal ? "done" : hasSpecs ? "current" : "pending",
    },
    {
      id: "plan",
      name: "Plan",
      status: hasSpecs ? "done" : hasProposal ? "current" : "pending",
    },
    {
      id: "design",
      name: "Design",
      status: hasDesign ? "done" : hasSpecs ? "current" : "pending",
    },
    {
      id: "tasks",
      name: "Tasks",
      status: hasTasks ? "done" : hasDesign ? "current" : "pending",
    },
    { id: "apply", name: "Apply", status: "pending" },
    { id: "archive", name: "Archive", status: "pending" },
  ];
}
