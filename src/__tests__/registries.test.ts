import { describe, expect, it } from "bun:test";
import { buildRulesPrompt, loadRules } from "../rules/registry";
import {
  buildSkillsPrompt,
  filterSkillsForStep,
  getSkillContent,
  loadSkills,
} from "../skills/registry";

describe("Skills Registry", () => {
  it("should load skills from src directory", () => {
    const skills = loadSkills("/nonexistent/project");
    // Should load bundled skills from src/skills/
    expect(Array.isArray(skills)).toBe(true);
  });

  it("builds a lightweight manifest (name + description, no body)", () => {
    const skills = [
      {
        name: "test-skill",
        description: "A test skill",
        triggers: ["test"],
        content: "Test content",
      },
    ];
    const prompt = buildSkillsPrompt(skills);
    expect(prompt).toContain("Available Skills");
    expect(prompt).toContain("test-skill");
    expect(prompt).toContain("A test skill");
    expect(prompt).toContain("read_skill");
    // the full body is loaded on demand, never injected into the prompt
    expect(prompt).not.toContain("Test content");
  });

  it("should return empty string for no skills", () => {
    const prompt = buildSkillsPrompt([]);
    expect(prompt).toBe("");
  });

  it("getSkillContent returns the full body on demand, null when unknown", () => {
    const skills = [
      {
        name: "test-skill",
        description: "A test skill",
        triggers: ["test"],
        content: "Test content",
      },
    ];
    const content = getSkillContent(skills, "test-skill");
    expect(content).toContain("test-skill");
    expect(content).toContain("Test content");
    expect(getSkillContent(skills, "nope")).toBeNull();
  });
});

describe("filterSkillsForStep", () => {
  const skill = (name: string) => ({
    name,
    description: "",
    triggers: [],
    content: "",
  });
  const skills = [
    skill("code-review"),
    skill("obsidian-cli"),
    skill("openspec-propose"),
    skill("openspec-apply-change"),
    skill("openspec-archive-change"),
  ];
  const names = (stepId: string) =>
    filterSkillsForStep(skills, stepId).map((s) => s.name);

  it("always keeps non-openspec skills", () => {
    for (const step of ["discuss", "proposal", "apply", "archive", "unknown"]) {
      expect(names(step)).toContain("code-review");
      expect(names(step)).toContain("obsidian-cli");
    }
  });

  it("excludes all openspec skills during discuss", () => {
    expect(names("discuss")).toEqual(["code-review", "obsidian-cli"]);
  });

  it("keeps only the matching openspec skill per step", () => {
    expect(names("proposal")).toContain("openspec-propose");
    expect(names("proposal")).not.toContain("openspec-apply-change");
    expect(names("apply")).toContain("openspec-apply-change");
    expect(names("apply")).not.toContain("openspec-propose");
    expect(names("archive")).toContain("openspec-archive-change");
    expect(names("archive")).not.toContain("openspec-apply-change");
  });

  it("keeps the propose skill through design, specs and tasks steps", () => {
    for (const step of ["design", "specs", "tasks"]) {
      expect(names(step)).toContain("openspec-propose");
    }
  });
});

describe("Rules Registry", () => {
  it("should load rules from src directory", () => {
    const rules = loadRules();
    expect(Array.isArray(rules)).toBe(true);
  });

  it("should build rules prompt", () => {
    const rules = [
      {
        name: "test-rule",
        description: "A test rule",
        appliesTo: "*.ts",
        content: "Rule content",
      },
    ];
    const prompt = buildRulesPrompt(rules);
    expect(prompt).toContain("Rules");
    expect(prompt).toContain("test-rule");
    expect(prompt).toContain("Rule content");
  });

  it("should return empty string for no rules", () => {
    const prompt = buildRulesPrompt([]);
    expect(prompt).toBe("");
  });
});
