import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { intro, log, outro } from "@clack/prompts";
import { AGENTS_MD, RULES, SKILLS } from "../../assets";
import { generateDevcontainer } from "../../services/devcontainer";
import { generateDiataxisDocs } from "../../services/doc-generator";
import { installOpenSpec } from "../../services/openspec-setup";
import { syncOpenSpecToVault } from "../../services/openspec-sync";
import { generateProjectStructure } from "../../services/project-scaffold";
import { askStackQuestions } from "../prompts/stack-questions";

export async function initHandler() {
  try {
    intro("paikea init");

    const config = await askStackQuestions();

    log.step("Creating project...");
    generateProjectStructure(config);

    log.step("Generating devcontainer...");
    generateDevcontainer(config);

    log.step("Installing OpenSpec...");
    await installOpenSpec(config.name);

    log.step("Syncing OpenSpec to vault...");
    syncOpenSpecToVault(config.name);

    log.step("Copying config files...");
    copyConfigFiles(config.name);

    log.step("Generating Obsidian vault...");
    generateVault(config.name);

    log.step("Generating Diataxis documentation...");
    generateDiataxisDocs({
      outputDir: join(config.name, "docs"),
      scope: join(config.name, "src"),
      projectName: config.name,
    });

    outro(`Done! Run: cd ${config.name} && paikea`);
  } catch (error) {
    outro(
      `Error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
  }
}

function generateVault(projectName: string) {
  const vaultDir = join(projectName, ".paikea", "vault");

  mkdirSync(join(vaultDir, "logs"), { recursive: true });
  mkdirSync(join(vaultDir, "skills"), { recursive: true });
  mkdirSync(join(vaultDir, "rules"), { recursive: true });
  mkdirSync(join(vaultDir, "specs"), { recursive: true });
  mkdirSync(join(vaultDir, "templates"), { recursive: true });

  writeFileSync(
    join(vaultDir, "index.md"),
    `# ${projectName} Vault

Generated on ${new Date().toISOString().split("T")[0] ?? new Date().toISOString()}

## Structure

- \`logs/\` - Session logs
- \`skills/\` - Skill documentation
- \`rules/\` - Project rules
- \`specs/\` - OpenSpec specifications
- \`templates/\` - Document templates

## Usage

This vault is automatically maintained by paikea. Open it with Obsidian:

\`\`\`bash
obsidian .paikea/vault
\`\`\`
`,
  );

  writeFileSync(
    join(vaultDir, "templates", "session-log.md"),
    `---
date: {{date}}
model: {{model}}
tokens_used: {{tokens}}
duration: {{duration}}
---

## Session {{date}}

### Prompt 1
> {{prompt}}

**Thinking:** {{thinking}}

**Response:** {{response}}
`,
  );

  writeFileSync(
    join(vaultDir, "templates", "skill-doc.md"),
    `---
name: {{name}}
description: {{description}}
triggers:
  - {{trigger}}
---

{{content}}
`,
  );

  writeFileSync(
    join(vaultDir, "templates", "spec-doc.md"),
    `---
title: {{title}}
status: {{status}}
created: {{date}}
---

# {{title}}

## Description

{{description}}

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Notes

{{notes}}
`,
  );
}

function copyConfigFiles(projectName: string) {
  writeFileSync(join(projectName, "AGENTS.md"), AGENTS_MD);

  const skillsDir = join(projectName, ".paikea", "skills");
  mkdirSync(skillsDir, { recursive: true });
  for (const [file, content] of Object.entries(SKILLS)) {
    const filePath = join(skillsDir, file);
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, content);
  }

  const rulesDir = join(projectName, ".paikea", "rules");
  mkdirSync(rulesDir, { recursive: true });
  for (const [file, content] of Object.entries(RULES)) {
    const filePath = join(rulesDir, file);
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, content);
  }
}
