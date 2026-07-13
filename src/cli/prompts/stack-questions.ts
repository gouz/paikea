import { cancel, isCancel, multiselect, select, text } from "@clack/prompts";
import type { ProjectConfig } from "../../types";

const FRAMEWORKS_BY_LANG: Record<
  string,
  { value: string; label: string; hint?: string }[]
> = {
  typescript: [
    { value: "nextjs", label: "Next.js", hint: "recommended" },
    { value: "express", label: "Express" },
    { value: "fastify", label: "Fastify" },
    { value: "hono", label: "Hono" },
    { value: "bun", label: "Bun" },
    { value: "nest", label: "NestJS" },
    { value: "astro", label: "Astro" },
    { value: "remix", label: "Remix" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  python: [
    { value: "fastapi", label: "FastAPI", hint: "recommended" },
    { value: "django", label: "Django" },
    { value: "flask", label: "Flask" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  go: [
    { value: "gin", label: "Gin", hint: "recommended" },
    { value: "echo", label: "Echo" },
    { value: "fiber", label: "Fiber" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  rust: [
    { value: "axum", label: "Axum", hint: "recommended" },
    { value: "actix", label: "Actix Web" },
    { value: "rocket", label: "Rocket" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  ruby: [
    { value: "rails", label: "Rails", hint: "recommended" },
    { value: "sinatra", label: "Sinatra" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  php: [
    { value: "laravel", label: "Laravel", hint: "recommended" },
    { value: "symfony", label: "Symfony" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  java: [
    { value: "spring", label: "Spring Boot", hint: "recommended" },
    { value: "quarkus", label: "Quarkus" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
  dotnet: [
    { value: "aspnet", label: "ASP.NET Core", hint: "recommended" },
    { value: "vanilla", label: "Vanilla (no framework)" },
    { value: "custom", label: "Custom (manual input)" },
  ],
};

export async function askStackQuestions(): Promise<ProjectConfig> {
  const name = await text({
    message: "Project name?",
    placeholder: "my-project",
    validate: (v) => {
      if (!v) return "Required";
      if (!/^[a-z0-9-]+$/.test(v))
        return "Lowercase letters, numbers, and hyphens only";
      return undefined;
    },
  });
  if (isCancel(name) || !name) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const lang = await select({
    message: "Language / Runtime?",
    options: [
      {
        value: "typescript",
        label: "TypeScript / Node.js / Bun",
        hint: "recommended",
      },
      { value: "python", label: "Python" },
      { value: "go", label: "Go" },
      { value: "rust", label: "Rust" },
      { value: "ruby", label: "Ruby" },
      { value: "php", label: "PHP" },
      { value: "java", label: "Java" },
      { value: "dotnet", label: ".NET / C#" },
      { value: "custom", label: "Custom (manual input)" },
    ],
  });
  if (isCancel(lang) || !lang) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  let framework: string;

  if (lang === "custom") {
    const customLang = await text({
      message: "Language / runtime name?",
      placeholder: "e.g. zig, swift, kotlin...",
      validate: (v) => (v ? undefined : "Required"),
    });
    if (isCancel(customLang) || !customLang) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
    framework = customLang;

    const customFramework = await text({
      message: "Framework? (leave empty for none)",
      placeholder: "e.g. actix, gin, fastapi...",
    });
    if (isCancel(customFramework) || customFramework === undefined) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
    framework = customFramework || "vanilla";
  } else {
    const frameworkChoice = await select({
      message: "Framework?",
      options: FRAMEWORKS_BY_LANG[lang] ?? [],
    });
    if (isCancel(frameworkChoice) || !frameworkChoice) {
      cancel("Operation cancelled.");
      process.exit(0);
    }

    if (frameworkChoice === "custom") {
      const customFramework = await text({
        message: "Framework name?",
        placeholder: "e.g. express, fastapi, gin...",
        validate: (v) => (v ? undefined : "Required"),
      });
      if (isCancel(customFramework) || !customFramework) {
        cancel("Operation cancelled.");
        process.exit(0);
      }
      framework = customFramework;
    } else {
      framework = frameworkChoice;
    }
  }

  const database = await multiselect({
    message: "Databases?",
    options: [
      { value: "none", label: "None" },
      { value: "postgres", label: "PostgreSQL" },
      { value: "mysql", label: "MySQL" },
      { value: "mongodb", label: "MongoDB" },
      { value: "redis", label: "Redis" },
      { value: "sqlite", label: "SQLite" },
      { value: "custom", label: "Custom (manual input)" },
    ],
    required: false,
  });
  if (isCancel(database) || database === undefined) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const finalDatabase = database.filter((d) => d !== "custom");
  if (database.includes("custom")) {
    const customDb = await text({
      message: "Database name?",
      placeholder: "e.g. cockroachdb, mariadb, dynamodb...",
      validate: (v) => (v ? undefined : "Required"),
    });
    if (isCancel(customDb) || !customDb) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
    finalDatabase.push(
      customDb as
        | "postgres"
        | "mysql"
        | "mongodb"
        | "redis"
        | "none"
        | "sqlite",
    );
  }

  const services = await multiselect({
    message: "Additional services?",
    options: [
      { value: "redis", label: "Redis" },
      { value: "meilisearch", label: "Meilisearch" },
      { value: "rabbitmq", label: "RabbitMQ" },
      { value: "mailhog", label: "MailHog" },
      { value: "custom", label: "Custom (manual input)" },
    ],
    required: false,
  });
  if (isCancel(services) || services === undefined) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const finalServices = services.filter((s) => s !== "custom");
  if (services.includes("custom")) {
    const customService = await text({
      message: "Service name?",
      placeholder: "e.g. minio, vault, consul...",
      validate: (v) => (v ? undefined : "Required"),
    });
    if (isCancel(customService) || !customService) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
    finalServices.push(
      customService as "redis" | "meilisearch" | "rabbitmq" | "mailhog",
    );
  }

  return {
    name,
    lang,
    framework,
    database: finalDatabase,
    services: finalServices,
    port: 3000,
  };
}
