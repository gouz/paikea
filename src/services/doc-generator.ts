import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export interface DiataxisConfig {
  outputDir: string;
  scope: string;
  projectName: string;
}

interface DocSection {
  type: "tutorials" | "how-to" | "reference" | "explanation";
  title: string;
  content: string;
  filename: string;
}

export function generateDiataxisDocs(config: DiataxisConfig) {
  const docsDir = config.outputDir;
  const sections: DocSection[] = [];

  const hasTypescript = hasFilesWithExt(config.scope, ".ts", ".tsx");
  const hasPython = hasFilesWithExt(config.scope, ".py");
  const hasApiRoutes = hasFilesInDir(
    config.scope,
    "api",
    "route",
    "controller",
  );

  sections.push(...generateTutorials(config, { hasTypescript, hasPython }));
  sections.push(...generateHowToGuides(config, { hasApiRoutes }));
  sections.push(...generateReferenceDocs(config));
  sections.push(...generateExplanationDocs(config));

  for (const section of sections) {
    const sectionDir = join(docsDir, section.type);
    mkdirSync(sectionDir, { recursive: true });
    writeFileSync(join(sectionDir, section.filename), section.content);
  }

  writeFileSync(
    join(docsDir, "index.md"),
    generateDiataxisIndex(config, sections),
  );
  writeFileSync(join(docsDir, "_Sidebar.md"), generateNavigation(config));
}

function hasFilesWithExt(scope: string, ...exts: string[]): boolean {
  try {
    if (!existsSync(scope)) return false;
    const stat = statSync(scope);
    if (stat.isFile()) return exts.some((ext) => scope.endsWith(ext));
    return hasFilesWithExtInDir(scope, exts);
  } catch {
    return false;
  }
}

function hasFilesWithExtInDir(dir: string, exts: string[]): boolean {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && hasFilesWithExtInDir(fullPath, exts))
      return true;
    if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext)))
      return true;
  }
  return false;
}

function hasFilesInDir(scope: string, ...patterns: string[]): boolean {
  try {
    if (!existsSync(scope)) return false;
    const stat = statSync(scope);
    if (stat.isFile()) return false;
    return hasFilesWithPatterns(scope, patterns);
  } catch {
    return false;
  }
}

function hasFilesWithPatterns(dir: string, patterns: string[]): boolean {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && hasFilesWithPatterns(fullPath, patterns))
      return true;
    if (
      entry.isFile() &&
      patterns.some((p) => entry.name.toLowerCase().includes(p))
    )
      return true;
  }
  return false;
}

function generateTutorials(
  config: DiataxisConfig,
  flags: { hasTypescript: boolean; hasPython: boolean },
): DocSection[] {
  const sections: DocSection[] = [];

  sections.push({
    type: "tutorials",
    title: `Getting Started with ${config.projectName}`,
    filename: "getting-started.md",
    content: `# Getting Started with ${config.projectName}

This tutorial walks you through setting up and running the project.

## Prerequisites

- Docker Desktop installed
${flags.hasTypescript ? "- Bun or Node.js installed\n" : ""}
${flags.hasPython ? "- Python 3.12+ installed\n" : ""}
## Step 1: Clone the repository

\`\`\`bash
git clone <repository-url>
cd ${config.projectName}
\`\`\`

## Step 2: Start the development container

If using VS Code with Dev Containers extension:

1. Open the project in VS Code
2. Click "Reopen in Container" when prompted
3. Wait for the container to build

Or manually:

\`\`\`bash
cd .devcontainer
docker compose up -d
docker compose exec app bash
\`\`\`

## Step 3: Install dependencies

\`\`\`bash
${flags.hasTypescript ? "bun install" : flags.hasPython ? "pip install -r requirements.txt" : "# Install dependencies"}
\`\`\`

## Step 4: Run the application

\`\`\`bash
${flags.hasTypescript ? "bun run dev" : flags.hasPython ? "python main.py" : "# Run the application"}
\`\`\`

## Next Steps

- Read the [How-to Guides](../how-to/) for specific tasks
- Check the [Reference](../reference/) for API documentation
- See the [Explanation](../explanation/) for architecture details
`,
  });

  if (flags.hasTypescript) {
    sections.push({
      type: "tutorials",
      title: "TypeScript Development Setup",
      filename: "typescript-setup.md",
      content: `# TypeScript Development Setup

This tutorial covers setting up TypeScript development for ${config.projectName}.

## Configuration

The project uses TypeScript with strict mode enabled.

## Development Workflow

### Running in development mode

\`\`\`bash
bun run dev
\`\`\`

### Type checking

\`\`\`bash
bun run typecheck
\`\`\`

### Building

\`\`\`bash
bun run build
\`\`\`
`,
    });
  }

  return sections;
}

function generateHowToGuides(
  config: DiataxisConfig,
  flags: { hasApiRoutes: boolean },
): DocSection[] {
  const sections: DocSection[] = [];

  sections.push({
    type: "how-to",
    title: "Common Tasks",
    filename: "common-tasks.md",
    content: `# Common Tasks

## How to add a new feature

1. Create a new branch from \`main\`
2. Implement your changes
3. Add tests for new functionality
4. Run the test suite
5. Submit a pull request

## How to fix a bug

1. Create an issue describing the bug
2. Create a branch for the fix
3. Write a failing test that reproduces the bug
4. Fix the bug
5. Verify the test passes
6. Submit a pull request

## How to run tests

\`\`\`bash
bun test
\`\`\`

## How to deploy

\`\`\`bash
docker build -t ${config.projectName} .
docker run -p 3000:3000 ${config.projectName}
\`\`\`
`,
  });

  if (flags.hasApiRoutes) {
    sections.push({
      type: "how-to",
      title: "API Development",
      filename: "api-development.md",
      content: `# API Development

## How to add a new endpoint

1. Create a new route file
2. Define the handler function
3. Add validation for request parameters
4. Write tests for the endpoint

## How to add authentication

1. Install authentication middleware
2. Configure JWT/Session strategy
3. Add protected routes

## How to add rate limiting

1. Install rate limiting library
2. Configure rate limits per endpoint
3. Add rate limit headers
`,
    });
  }

  return sections;
}

function generateReferenceDocs(config: DiataxisConfig): DocSection[] {
  return [
    {
      type: "reference",
      title: "Project Structure",
      filename: "project-structure.md",
      content: `# Project Structure

## Directory Layout

\`\`\`
${config.projectName}/
├── src/                    # Source code
├── public/                 # Static assets
├── tests/                  # Test files
├── .devcontainer/          # Dev container configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── devcontainer.json
├── package.json            # Dependencies
└── README.md               # Project documentation
\`\`\`

## Key Files

- \`package.json\` - Project dependencies and scripts
- \`.env.example\` - Environment variables template
`,
    },
    {
      type: "reference",
      title: "API Reference",
      filename: "api-reference.md",
      content: `# API Reference

## Endpoints

### GET /api/health

Health check endpoint.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

## Error Responses

All endpoints follow the same error format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`
`,
    },
  ];
}

function generateExplanationDocs(config: DiataxisConfig): DocSection[] {
  return [
    {
      type: "explanation",
      title: "Architecture Overview",
      filename: "architecture.md",
      content: `# Architecture Overview

## High-Level Design

${config.projectName} follows a layered architecture pattern:

1. **Presentation Layer** - User interface and API endpoints
2. **Business Logic Layer** - Core application logic
3. **Data Access Layer** - Database and external services

## Design Principles

### Separation of Concerns

Each module has a single responsibility and is isolated from other modules.

### Dependency Injection

Dependencies are injected rather than hard-coded, making testing easier.

## Data Flow

1. User action triggers request
2. Controller validates and processes request
3. Service layer executes business logic
4. Data layer persists/retrieves data
5. Response is formatted and returned
`,
    },
    {
      type: "explanation",
      title: "Design Decisions",
      filename: "design-decisions.md",
      content: `# Design Decisions

## Why this architecture?

The architecture was chosen to balance:

- **Development speed** - Quick iteration and deployment
- **Maintainability** - Easy to understand and modify
- **Scalability** - Can grow with the project
- **Testability** - Easy to write and run tests

## Trade-offs

### Simplicity vs Flexibility

We chose simplicity over flexibility to keep the codebase approachable.

### Performance vs Readability

We prioritized readability over micro-optimizations.
`,
    },
  ];
}

function generateDiataxisIndex(
  config: DiataxisConfig,
  sections: DocSection[],
): string {
  let md = `# ${config.projectName} Documentation\n\n`;
  md += `Generated using [Diátaxis](https://diataxis.fr/) methodology\n\n`;

  md += `## 📚 Documentation Quadrants\n\n`;

  const tutorials = sections.filter((s) => s.type === "tutorials");
  const howTos = sections.filter((s) => s.type === "how-to");
  const reference = sections.filter((s) => s.type === "reference");
  const explanation = sections.filter((s) => s.type === "explanation");

  md += `### 🎓 Tutorials (Learning-oriented)\n\n`;
  for (const t of tutorials) md += `- [${t.title}](tutorials/${t.filename})\n`;

  md += `\n### 🛠️ How-to Guides (Task-oriented)\n\n`;
  for (const h of howTos) md += `- [${h.title}](how-to/${h.filename})\n`;

  md += `\n### 📖 Reference (Information-oriented)\n\n`;
  for (const r of reference) md += `- [${r.title}](reference/${r.filename})\n`;

  md += `\n### 💡 Explanation (Understanding-oriented)\n\n`;
  for (const e of explanation)
    md += `- [${e.title}](explanation/${e.filename})\n`;

  return md;
}

function generateNavigation(config: DiataxisConfig): string {
  return `# ${config.projectName}

## Documentation

- [Tutorials](tutorials/)
- [How-to Guides](how-to/)
- [Reference](reference/)
- [Explanation](explanation/)

## Resources

- [Project Structure](reference/project-structure.md)
- [API Reference](reference/api-reference.md)
- [Architecture](explanation/architecture.md)
`;
}
