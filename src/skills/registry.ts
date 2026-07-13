import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  content: string;
  // Internal skills back paikea's own plumbing (e.g. the Obsidian vault used to
  // store spec/decision docs). They are loaded but never advertised to the
  // model, so the user's own project work isn't nudged toward them.
  internal: boolean;
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
  const description = parseDescription(frontmatter);
  const triggersRaw = frontmatter.match(/^triggers:\n((?:\s*-\s*.+\n?)+)/m);
  const internal = /^internal:\s*true\b/m.test(frontmatter);

  if (!name || !description) return null;

  const triggers: string[] = [];
  if (triggersRaw?.[1]) {
    const triggerLines = triggersRaw[1].split("\n").filter((l) => l.trim());
    for (const line of triggerLines) {
      const match = line.match(/^\s*-\s*(.+)$/);
      if (match?.[1]) triggers.push(match[1].trim());
    }
  }

  return { name, description, triggers, content: body.trim(), internal };
}

// Read a frontmatter `description`, supporting both an inline value and YAML
// folded/literal block scalars (`description: >` followed by indented lines) —
// otherwise a folded description parses as the bare `>` marker.
function parseDescription(frontmatter: string): string | undefined {
  const inline = frontmatter.match(/^description:[ \t]*([^\s>|][^\n]*)$/m);
  if (inline?.[1]?.trim()) return inline[1].trim();

  const block = frontmatter.match(
    /^description:[ \t]*[>|][^\n]*\n((?:[ \t]+.*\n?)+)/m,
  );
  if (block?.[1]) {
    return block[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ");
  }
  return undefined;
}

// The skills advertised to the model. Only user-facing skills reach it:
// paikea's own plumbing stays under the hood so the user's project work isn't
// nudged toward it or warned about "conflicts" with it. That plumbing is
//   - `internal`-flagged skills (e.g. the Obsidian vault backing spec/decision
//     docs), and
//   - the OpenSpec workflow skills (name contains "openspec"), which paikea
//     drives itself via the per-step Workflow guidance, not by the model
//     picking them as a capability.
export function advertisedSkills(skills: Skill[]): Skill[] {
  return skills.filter(
    (skill) =>
      !skill.internal && !skill.name.toLowerCase().includes("openspec"),
  );
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
