import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CONFIG_DIR = join(process.env.HOME ?? "~", ".paikea");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface PaikeaConfig {
  theme: string;
}

function ensureConfigDir() {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

export function loadConfig(): PaikeaConfig {
  if (!existsSync(CONFIG_FILE)) {
    return { theme: "dark" };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as PaikeaConfig;
  } catch {
    return { theme: "dark" };
  }
}

export function saveConfig(config: PaikeaConfig) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getSavedTheme(): string {
  return loadConfig().theme;
}

export function saveTheme(themeName: string) {
  const config = loadConfig();
  config.theme = themeName;
  saveConfig(config);
}
