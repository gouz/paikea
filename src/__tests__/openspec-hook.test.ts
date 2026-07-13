import { describe, expect, it } from "bun:test";
import {
  buildStepPrompt,
  detectOpenSpecSteps,
} from "../services/openspec-hook";

describe("detectOpenSpecSteps", () => {
  it("falls back to a single discuss step outside an OpenSpec project", () => {
    // No CLI / not an OpenSpec project → chat-only workflow
    const steps = detectOpenSpecSteps("/nonexistent/path");
    expect(steps).toHaveLength(1);
    expect(steps[0]?.id).toBe("discuss");
    expect(steps[0]?.status).toBe("current");
  });

  it("always starts the workflow with a non-OpenSpec discuss step", () => {
    const steps = detectOpenSpecSteps(process.cwd());
    expect(steps[0]?.id).toBe("discuss");
  });

  it("exposes exactly one current step", () => {
    const steps = detectOpenSpecSteps(process.cwd());
    expect(steps.filter((s) => s.status === "current")).toHaveLength(1);
  });

  it("orders discuss before any OpenSpec artifact steps", () => {
    const steps = detectOpenSpecSteps(process.cwd());
    const discussIdx = steps.findIndex((s) => s.id === "discuss");
    const proposalIdx = steps.findIndex((s) => s.id === "proposal");
    // In this repo OpenSpec is set up, so proposal should be present and after discuss
    if (proposalIdx >= 0) {
      expect(discussIdx).toBeLessThan(proposalIdx);
    }
  });
});

describe("buildStepPrompt", () => {
  it("tells the model NOT to touch OpenSpec during discuss", () => {
    const prompt = buildStepPrompt("discuss");
    expect(prompt).toContain("Workflow");
    expect(prompt.toLowerCase()).toContain("do not");
    expect(prompt.toLowerCase()).toContain("openspec");
  });

  it("mentions the matching openspec command for each openspec step", () => {
    expect(buildStepPrompt("proposal")).toContain("openspec new change");
    expect(buildStepPrompt("specs")).toContain("openspec validate");
    expect(buildStepPrompt("apply")).toContain("openspec validate");
    expect(buildStepPrompt("archive")).toContain("openspec archive");
  });

  it("returns empty string for unknown steps", () => {
    expect(buildStepPrompt("nope")).toBe("");
  });
});
