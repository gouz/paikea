import { describe, expect, it } from "bun:test";
import { buildRulesPrompt, loadRules } from "../rules/registry";
import {
  advertisedSkills,
  buildSkillsPrompt,
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
        internal: false,
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
        internal: false,
      },
    ];
    const content = getSkillContent(skills, "test-skill");
    expect(content).toContain("test-skill");
    expect(content).toContain("Test content");
    expect(getSkillContent(skills, "nope")).toBeNull();
  });

  it("does not advertise the internal obsidian-cli skill", () => {
    const skills = loadSkills("/nonexistent/project");
    const obsidian = skills.find((s) => s.name === "obsidian-cli");
    // It is still loaded (so internal plumbing can reach it) …
    expect(obsidian).toBeDefined();
    expect(obsidian?.internal).toBe(true);
    // … but never surfaced to the model.
    const names = advertisedSkills(skills).map((s) => s.name);
    expect(names).not.toContain("obsidian-cli");
    const prompt = buildSkillsPrompt(advertisedSkills(skills));
    expect(prompt.toLowerCase()).not.toContain("obsidian");
  });

  it("parses folded/literal block descriptions instead of the bare marker", () => {
    const skills = loadSkills("/nonexistent/project");
    const obsidian = skills.find((s) => s.name === "obsidian-cli");
    // obsidian-cli uses `description: >` folded scalar frontmatter.
    expect(obsidian?.description).not.toBe(">");
    expect(obsidian?.description?.length ?? 0).toBeGreaterThan(20);
  });
});

describe("advertisedSkills", () => {
  const skill = (name: string, internal = false) => ({
    name,
    description: "",
    triggers: [],
    content: "",
    internal,
  });
  const skills = [
    skill("code-review"),
    skill("obsidian-cli", true), // internal plumbing
    skill("openspec-propose"),
    skill("openspec-apply-change"),
    skill("openspec-archive-change"),
  ];
  const names = advertisedSkills(skills).map((s) => s.name);

  it("keeps user-facing skills", () => {
    expect(names).toContain("code-review");
  });

  it("never advertises internal-flagged skills", () => {
    expect(names).not.toContain("obsidian-cli");
  });

  it("never advertises openspec workflow skills (internal plumbing)", () => {
    expect(names).not.toContain("openspec-propose");
    expect(names).not.toContain("openspec-apply-change");
    expect(names).not.toContain("openspec-archive-change");
  });

  it("advertises only the user-facing skills", () => {
    expect(names).toEqual(["code-review"]);
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
