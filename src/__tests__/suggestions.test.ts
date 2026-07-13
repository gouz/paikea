import { describe, expect, it } from "bun:test";
import {
  computeStepCommands,
  computeSuggestions,
  getCurrentStepId,
  matchStepCommand,
} from "../services/suggestions";

const STEPS = ["discuss", "proposal", "design", "specs", "tasks", "apply"];

describe("computeStepCommands", () => {
  it("lists all step commands for a bare slash", () => {
    expect(computeStepCommands("/", STEPS)).toEqual([
      "/discuss",
      "/proposal",
      "/design",
      "/specs",
      "/tasks",
      "/apply",
    ]);
  });

  it("filters by prefix", () => {
    expect(computeStepCommands("/pro", STEPS)).toEqual(["/proposal"]);
    expect(computeStepCommands("/t", STEPS)).toEqual(["/tasks"]);
  });
});

describe("matchStepCommand", () => {
  it("resolves an exact command", () => {
    expect(matchStepCommand("/apply", STEPS)).toBe("apply");
    expect(matchStepCommand("  /discuss  ", STEPS)).toBe("discuss");
  });

  it("resolves a unique prefix", () => {
    expect(matchStepCommand("/propose", STEPS)).toBe("proposal");
    expect(matchStepCommand("/ap", STEPS)).toBe("apply");
  });

  it("returns null for ambiguous, unknown or non-commands", () => {
    expect(matchStepCommand("/d", STEPS)).toBeNull(); // discuss + design
    expect(matchStepCommand("/nope", STEPS)).toBeNull();
    expect(matchStepCommand("hello", STEPS)).toBeNull();
    expect(matchStepCommand("/", STEPS)).toBeNull();
  });
});

describe("computeSuggestions", () => {
  it("should return discuss suggestions for empty prompt", () => {
    const suggestions = computeSuggestions("", "discuss");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toBe("Let's explore the problem space");
  });

  it("should filter suggestions by prefix", () => {
    const suggestions = computeSuggestions("Let's", "discuss");
    expect(suggestions.length).toBe(1);
    expect(suggestions[0]).toBe("Let's explore the problem space");
  });

  it("should return empty array when no match", () => {
    const suggestions = computeSuggestions("xyz", "discuss");
    expect(suggestions).toHaveLength(0);
  });

  it("should return proposal suggestions for proposal step", () => {
    const suggestions = computeSuggestions("", "proposal");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes("proposal"))).toBe(true);
  });

  it("should return all suggestions for empty prompt regardless of step", () => {
    for (const step of [
      "discuss",
      "proposal",
      "design",
      "specs",
      "tasks",
      "apply",
      "archive",
    ]) {
      const suggestions = computeSuggestions("", step);
      expect(suggestions.length).toBeGreaterThan(0);
    }
  });
});

describe("getCurrentStepId", () => {
  it("should return current step id", () => {
    const steps = [
      { id: "discuss", status: "done" },
      { id: "propose", status: "current" },
      { id: "plan", status: "pending" },
    ];
    expect(getCurrentStepId(steps)).toBe("propose");
  });

  it("should return discuss when no current step", () => {
    const steps = [
      { id: "discuss", status: "pending" },
      { id: "propose", status: "pending" },
    ];
    expect(getCurrentStepId(steps)).toBe("discuss");
  });

  it("should return discuss for empty steps", () => {
    expect(getCurrentStepId([])).toBe("discuss");
  });
});
