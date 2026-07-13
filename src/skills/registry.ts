import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  content: string;
}

export function loadSkills(projectDir: string): Skill[] {
  const skills: Skill[] = [];
  const srcDir = join(import.meta.dir, "..");

  // Load bundled skills
  loadSkillsFromDir(join(srcDir, "skills"), skills);

  // Load project skills (.paikea/skills/)
  const projectSkillsDir = join(projectDir, ".paikea", "skills");
  if (existsSync(projectSkillsDir)) {
    loadSkillsFromDir(projectSkillsDir, skills);
  }

  // Also check .claude/skills/ for compatibility
  const claudeSkillsDir = join(projectDir, ".claude", "skills");
  if (existsSync(claudeSkillsDir)) {
    loadSkillsFromDir(claudeSkillsDir, skills);
  }

  return skills;
}

function loadSkillsFromDir(dir: string, skills: Skill[]) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Check for SKILL.md in subdirectory
      const skillMdPath = join(fullPath, "SKILL.md");
      if (existsSync(skillMdPath)) {
        const content = readFileSync(skillMdPath, "utf-8");
        const skill = parseSkillFile(content);
        if (skill) {
          // Override if same name exists
          const idx = skills.findIndex((s) => s.name === skill.name);
          if (idx >= 0) {
            skills[idx] = skill;
          } else {
            skills.push(skill);
          }
        }
      }
    } else if (entry.name.endsWith(".md") && entry.name !== "SKILL.md") {
      // Load .md files directly in directory
      const content = readFileSync(fullPath, "utf-8");
      const skill = parseSkillFile(content);
      if (skill) {
        // Override if same name exists
        const idx = skills.findIndex((s) => s.name === skill.name);
        if (idx >= 0) {
          skills[idx] = skill;
        } else {
          skills.push(skill);
        }
      }
    }
  }
}

function parseSkillFile(content: string): Skill | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1] ?? "";
  const body = frontmatterMatch[2] ?? "";
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const triggersRaw = frontmatter.match(/^triggers:\n((?:\s*-\s*.+\n?)+)/m);

  if (!name || !description) return null;

  const triggers: string[] = [];
  if (triggersRaw?.[1]) {
    const triggerLines = triggersRaw[1].split("\n").filter((l) => l.trim());
    for (const line of triggerLines) {
      const match = line.match(/^\s*-\s*(.+)$/);
      if (match?.[1]) triggers.push(match[1].trim());
    }
  }

  return { name, description, triggers, content: body.trim() };
}

// Skills whose name contains "openspec" are step-specific: they are only
// injected when the active workflow step matches one of these keywords.
// All other skills are always available.
// The proposal → design → specs → tasks artifacts are all authored by the
// "propose" family of skills, so they stay available across those steps.
const OPENSPEC_STEP_KEYWORDS: Record<string, string[]> = {
  discuss: [],
  proposal: ["propose", "proposal"],
  design: ["propose", "proposal", "design"],
  specs: ["propose", "proposal", "spec"],
  tasks: ["propose", "proposal", "task"],
  apply: ["apply"],
  archive: ["archive"],
};

export function filterSkillsForStep(skills: Skill[], stepId: string): Skill[] {
  const keywords = OPENSPEC_STEP_KEYWORDS[stepId] ?? [];
  return skills.filter((skill) => {
    const name = skill.name.toLowerCase();
    if (!name.includes("openspec")) return true;
    return keywords.some((k) => name.includes(k));
  });
}

// A manifest only: names + one-line descriptions. Injecting every SKILL.md
// body cost ~3000 tokens and was re-evaluated on every turn; instead the model
// loads a skill's full instructions on demand with the `read_skill` tool.
export function buildSkillsPrompt(skills: Skill[]): string {
  if (skills.length === 0) return "";

  let prompt =
    "\n## Available Skills\n\n" +
    "When a task matches one of these skills, call the `read_skill` tool with " +
    "its name to load the full instructions before proceeding.\n\n";
  for (const skill of skills) {
    prompt += `- \`${skill.name}\`: ${skill.description}\n`;
  }
  prompt += "\n";

  return prompt;
}

// Full instructions for a single skill, loaded on demand by the read_skill
// tool. Returns null when no skill by that name is available.
export function getSkillContent(skills: Skill[], name: string): string | null {
  const skill = skills.find((s) => s.name === name);
  if (!skill) return null;
  return `# ${skill.name}\n\n${skill.description}\n\n${skill.content}`;
}
