import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { outro } from "@clack/prompts";

export async function obsidianHandler() {
  const vaultPath = join(process.cwd(), ".paikea", "vault");

  if (!existsSync(vaultPath)) {
    outro(
      "No vault found. Run `paikea init` first to create a project with vault.",
    );
    process.exit(1);
  }

  // Check if obsidian CLI is installed
  try {
    execSync("obsidian --version", { stdio: "ignore" });
  } catch {
    outro(
      "Obsidian CLI not found.\n\n" +
        "Install it:\n" +
        "  1. Open Obsidian\n" +
        "  2. Go to Settings > Community Plugins\n" +
        '  3. Search for "Obsidian CLI" and install it\n' +
        "  4. Or install manually: npm install -g @obisidian/cli\n\n" +
        "Then run this command again.",
    );
    process.exit(1);
  }

  // Sync OpenSpec to vault before opening
  try {
    const { syncOpenSpecToVault } = await import(
      "../../services/openspec-sync"
    );
    syncOpenSpecToVault(process.cwd());
  } catch {
    // Silent fail — vault will still open
  }

  // Open Obsidian with the vault
  try {
    execSync(`obsidian "${vaultPath}"`, { stdio: "inherit" });
  } catch {
    outro("Failed to open Obsidian. Is it running?");
    process.exit(1);
  }
}
