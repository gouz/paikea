import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Rule {
  name: string;
  description: string;
  appliesTo: string;
  content: string;
}

export function loadRules(): Rule[] {
  const rules: Rule[] = [];
  const rulesDir = join(import.meta.dir, "..", "rules");

  if (!existsSync(rulesDir)) return rules;

  const files = readdirSync(rulesDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const content = readFileSync(join(rulesDir, file), "utf-8");
    const rule = parseRuleFile(content);
    if (rule) rules.push(rule);
  }

  return rules;
}

function parseRuleFile(content: string): Rule | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1] ?? "";
  const body = frontmatterMatch[2] ?? "";
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const appliesTo =
    frontmatter.match(/^applies_to:\s*(.+)$/m)?.[1]?.trim() ?? "*";

  if (!name || !description) return null;

  return { name, description, appliesTo, content: body.trim() };
}

export function buildRulesPrompt(rules: Rule[]): string {
  if (rules.length === 0) return "";

  let prompt = "\n## Rules\n\n";
  for (const rule of rules) {
    prompt += `- **${rule.name}** (${rule.appliesTo}): ${rule.content}\n`;
  }

  return prompt;
}
