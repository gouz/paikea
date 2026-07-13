import { describe, expect, it } from "bun:test";
import { buildRulesPrompt, loadRules } from "../rules/registry";
import { buildSkillsPrompt, loadSkills } from "../skills/registry";

describe("Skills Registry", () => {
  it("should load skills from src directory", () => {
    const skills = loadSkills("/nonexistent/project");
    // Should load bundled skills from src/skills/
    expect(Array.isArray(skills)).toBe(true);
  });

  it("should build skills prompt", () => {
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
    expect(prompt).toContain("Test content");
  });

  it("should return empty string for no skills", () => {
    const prompt = buildSkillsPrompt([]);
    expect(prompt).toBe("");
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
