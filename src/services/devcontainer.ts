import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectConfig } from "../types";

const DOCKER_IMAGES: Record<string, string> = {
  typescript: "oven/bun:latest",
  python: "python:3.12-slim",
  go: "golang:1.22-alpine",
  rust: "rust:slim",
  ruby: "ruby:3.3-slim",
  php: "php:8.3-cli",
  java: "eclipse-temurin:21-jdk",
  dotnet: "mcr.microsoft.com/dotnet/sdk:8.0",
};

const DB_IMAGES: Record<string, { image: string; port: number }> = {
  postgres: { image: "postgres:16-alpine", port: 5432 },
  mysql: { image: "mysql:8.4", port: 3306 },
  mongodb: { image: "mongo:7", port: 27017 },
  redis: { image: "redis:7-alpine", port: 6379 },
};

const VSCODE_EXTENSIONS: Record<string, string[]> = {
  typescript: ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"],
  python: ["ms-python.python", "ms-python.vscode-pylance"],
  go: ["golang.go"],
  rust: ["rust-lang.rust-analyzer"],
  ruby: ["shopify.ruby-lsp"],
  php: ["bmewburn.vscode-intelephense-client"],
  java: ["vscjava.vscode-java-pack"],
  dotnet: ["ms-dotnettools.csdevkit"],
};

export function generateDevcontainer(config: ProjectConfig) {
  const dcDir = join(config.name, ".devcontainer");
  mkdirSync(dcDir, { recursive: true });

  const hasDb = config.database.length > 0 && !config.database.includes("none");
  const hasServices = config.services.length > 0;
  const needsCompose = hasDb || hasServices;

  const devcontainerJson: Record<string, unknown> = {
    name: config.name,
    build: {
      dockerfile: "Dockerfile",
      context: "..",
    },
    features: {},
    forwardPorts: [config.port],
    postCreateCommand: getPostCreateCommand(config),
    customizations: {
      vscode: {
        extensions: VSCODE_EXTENSIONS[config.lang] ?? [],
      },
    },
  };

  if (needsCompose) {
    devcontainerJson.runServices = [
      ...config.database.filter((d) => d !== "none"),
      ...config.services,
    ];
    devcontainerJson.dockerComposeFile = "docker-compose.yml";
  }

  writeFileSync(
    join(dcDir, "devcontainer.json"),
    `${JSON.stringify(devcontainerJson, null, 2)}\n`,
  );

  const dockerfile = generateDockerfile(config);
  writeFileSync(join(dcDir, "Dockerfile"), dockerfile);

  if (needsCompose) {
    const compose = generateCompose(config);
    writeFileSync(join(dcDir, "docker-compose.yml"), compose);
  }
}

function getPostCreateCommand(config: ProjectConfig): string {
  switch (config.lang) {
    case "typescript":
      return "bun install";
    case "python":
      return "pip install -r requirements.txt";
    case "go":
      return "go mod download";
    case "rust":
      return "cargo fetch";
    case "ruby":
      return "bundle install";
    case "php":
      return "composer install";
    case "java":
      return "./mvnw dependency:resolve";
    case "dotnet":
      return "dotnet restore";
    default:
      return "echo 'Setup your dependencies'";
  }
}

function generateDockerfile(config: ProjectConfig): string {
  const baseImage = DOCKER_IMAGES[config.lang] ?? "ubuntu:22.04";

  let dockerfile = `FROM ${baseImage}\n\n`;

  if (config.lang === "typescript") {
    dockerfile += `RUN curl -fsSL https://bun.sh/install | bash\n`;
    dockerfile += `ENV PATH="/root/.bun/bin:$PATH"\n`;
  }

  dockerfile += `WORKDIR /workspace\n`;
  dockerfile += `COPY . .\n`;

  return dockerfile;
}

function generateCompose(config: ProjectConfig): string {
  let compose = `version: "3.8"\n\nservices:\n`;

  for (const db of config.database) {
    if (db === "none") continue;
    const dbConfig = DB_IMAGES[db];
    if (!dbConfig) continue;

    compose += `  ${db}:\n`;
    compose += `    image: ${dbConfig.image}\n`;
    compose += `    ports:\n`;
    compose += `      - "${dbConfig.port}:${dbConfig.port}"\n`;

    if (db === "postgres") {
      compose += `    environment:\n`;
      compose += `      POSTGRES_USER: postgres\n`;
      compose += `      POSTGRES_PASSWORD: postgres\n`;
      compose += `      POSTGRES_DB: ${config.name}\n`;
    } else if (db === "mysql") {
      compose += `    environment:\n`;
      compose += `      MYSQL_ROOT_PASSWORD: root\n`;
      compose += `      MYSQL_DATABASE: ${config.name}\n`;
    } else if (db === "mongodb") {
      compose += `    volumes:\n`;
      compose += `      - mongo_data:/data/db\n`;
    } else if (db === "redis") {
      // redis needs no extra config
    }
    compose += "\n";
  }

  for (const svc of config.services) {
    if (svc === "redis") {
      compose += `  redis:\n`;
      compose += `    image: redis:7-alpine\n`;
      compose += `    ports:\n`;
      compose += `      - "6379:6379"\n\n`;
    } else if (svc === "meilisearch") {
      compose += `  meilisearch:\n`;
      compose += `    image: getmeili/meilisearch:v1.7\n`;
      compose += `    ports:\n`;
      compose += `      - "7700:7700"\n`;
      compose += `    environment:\n`;
      compose += `      MEILI_MASTER_KEY: masterKey\n\n`;
    } else if (svc === "minio") {
      compose += `  minio:\n`;
      compose += `    image: minio/minio\n`;
      compose += `    command: server /data --console-address ":9001"\n`;
      compose += `    ports:\n`;
      compose += `      - "9000:9000"\n`;
      compose += `      - "9001:9001"\n`;
      compose += `    volumes:\n`;
      compose += `      - minio_data:/data\n\n`;
    } else if (svc === "rabbitmq") {
      compose += `  rabbitmq:\n`;
      compose += `    image: rabbitmq:3-management\n`;
      compose += `    ports:\n`;
      compose += `      - "5672:5672"\n`;
      compose += `      - "15672:15672"\n\n`;
    } else if (svc === "mailhog") {
      compose += `  mailhog:\n`;
      compose += `    image: mailhog/mailhog\n`;
      compose += `    ports:\n`;
      compose += `      - "1025:1025"\n`;
      compose += `      - "8025:8025"\n\n`;
    }
  }

  const hasMongo = config.database.includes("mongodb");
  const hasMinio = config.services.includes("minio");
  if (hasMongo || hasMinio) {
    compose += `volumes:\n`;
    if (hasMongo) compose += `  mongo_data:\n`;
    if (hasMinio) compose += `  minio_data:\n`;
  }

  return compose;
}
