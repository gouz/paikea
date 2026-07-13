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

// Guess a sensible default theme from the terminal's background color.
// Terminals like iTerm2, rxvt and many others export COLORFGBG as "fg;bg"
// where the bg field is an ANSI color index (7 or 15 ≈ light background).
function detectDefaultTheme(): string {
  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const parts = colorfgbg.split(";");
    const bg = Number(parts[parts.length - 1]);
    if (bg === 7 || bg === 15) return "light";
  }
  return "dark";
}

export function loadConfig(): PaikeaConfig {
  if (!existsSync(CONFIG_FILE)) {
    return { theme: detectDefaultTheme() };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as PaikeaConfig;
  } catch {
    return { theme: detectDefaultTheme() };
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
