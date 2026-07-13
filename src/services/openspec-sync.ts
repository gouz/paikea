import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

const IGNORED_DIRS = new Set(["node_modules", ".git", ".paikea"]);
const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db"]);

export function syncOpenSpecToVault(projectDir: string): void {
  const openspecDir = join(projectDir, "openspec");
  const vaultDir = join(projectDir, ".paikea", "vault", "openspec");

  if (!existsSync(openspecDir)) return;

  mkdirSync(vaultDir, { recursive: true });
  syncDir(openspecDir, vaultDir, projectDir);
}

function syncDir(source: string, target: string, projectRoot: string): void {
  mkdirSync(target, { recursive: true });

  const entries = readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name) || IGNORED_FILES.has(entry.name)) continue;

    const srcPath = join(source, entry.name);
    const tgtPath = join(target, entry.name);

    if (entry.isDirectory()) {
      syncDir(srcPath, tgtPath, projectRoot);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".json")) {
      const srcStat = statSync(srcPath);
      const needsUpdate =
        !existsSync(tgtPath) || statSync(tgtPath).mtimeMs < srcStat.mtimeMs;

      if (needsUpdate) {
        const content = readFileSync(srcPath, "utf-8");
        const relPath = relative(projectRoot, srcPath);
        const enriched = addFrontmatter(content, relPath);
        writeFileSync(tgtPath, enriched);
      }
    }
  }
}

function addFrontmatter(content: string, filePath: string): string {
  if (content.startsWith("---")) return content;

  const now = new Date().toISOString().split("T")[0] ?? "";
  const type = filePath.includes("/specs/") ? "spec" : "change";
  const title = filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath;

  const frontmatter = `---
date: ${now}
tags: [openspec, ${type}]
type: resource
status: active
title: ${title}
source: ${filePath}
---
`;
  return frontmatter + content;
}
