import { describe, expect, it } from "bun:test";
import { computeSuggestions, getCurrentStepId } from "../services/suggestions";

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

  it("should return propose suggestions for propose step", () => {
    const suggestions = computeSuggestions("", "propose");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes("proposal"))).toBe(true);
  });

  it("should return all suggestions for empty prompt regardless of step", () => {
    for (const step of [
      "discuss",
      "propose",
      "plan",
      "design",
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
