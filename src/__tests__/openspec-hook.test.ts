import { describe, expect, it } from "bun:test";
import { detectOpenSpecSteps } from "../services/openspec-hook";

describe("detectOpenSpecSteps", () => {
  it("should return all pending steps when no openspec dir exists", () => {
    const steps = detectOpenSpecSteps("/nonexistent/path");
    expect(steps).toHaveLength(7);
    expect(steps[0]?.status).toBe("current");
    expect(steps.slice(1).every((s) => s.status === "pending")).toBe(true);
  });

  it("should return correct step structure", () => {
    const steps = detectOpenSpecSteps("/nonexistent/path");
    const ids = steps.map((s) => s.id);
    expect(ids).toEqual([
      "discuss",
      "propose",
      "plan",
      "design",
      "tasks",
      "apply",
      "archive",
    ]);
  });

  it("should have correct step names", () => {
    const steps = detectOpenSpecSteps("/nonexistent/path");
    const names = steps.map((s) => s.name);
    expect(names).toEqual([
      "Discuss",
      "Propose",
      "Plan",
      "Design",
      "Tasks",
      "Apply",
      "Archive",
    ]);
  });
});
