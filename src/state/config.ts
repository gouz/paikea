import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CONFIG_DIR = join(process.env.HOME ?? "~", ".paikea");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const DEFAULT_DMR_SCHEME = "http";
const DEFAULT_DMR_HOST = "localhost";
const DEFAULT_DMR_PORT = 12434;

type DmrScheme = "http" | "https";

interface PaikeaConfig {
  theme: string;
  // Scheme of the Docker Model Runner OpenAI-compatible API. Optional —
  // falls back to DEFAULT_DMR_SCHEME unless explicitly "https".
  dmrScheme?: DmrScheme;
  // Host of the DMR API (hostname or IP, no scheme). Optional — falls back
  // to DEFAULT_DMR_HOST when absent or blank.
  dmrHost?: string;
  // Port of the DMR API. Optional — falls back to DEFAULT_DMR_PORT when
  // absent or invalid.
  dmrPort?: number;
  // Whether thinking-capable models should actually reason before answering.
  // Optional — defaults to false (faster, direct responses). Set true to
  // re-enable chain-of-thought.
  thinking?: boolean;
}

function ensureConfigDir() {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

// Guess a sensible default marine theme from the terminal's background color.
// Terminals like iTerm2, rxvt and many others export COLORFGBG as "fg;bg"
// where the bg field is an ANSI color index (7 or 15 ≈ light background).
function detectDefaultTheme(): string {
  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const parts = colorfgbg.split(";");
    const bg = Number(parts[parts.length - 1]);
    if (bg === 7 || bg === 15) return "dawn";
  }
  return "deep-sea";
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

// Thinking is off unless explicitly enabled in the config.
export function getThinkingEnabled(): boolean {
  return loadConfig().thinking === true;
}

export function saveThinkingEnabled(enabled: boolean) {
  const config = loadConfig();
  config.thinking = enabled;
  saveConfig(config);
}

// Only "https" overrides the default; any other value (missing, typo, wrong
// case) resolves to the default scheme.
export function resolveDmrScheme(configured?: string): DmrScheme {
  return configured?.toLowerCase() === "https" ? "https" : DEFAULT_DMR_SCHEME;
}

// A host is usable only if it is a non-blank string; anything else falls
// back to the default. The value is trimmed of surrounding whitespace.
export function resolveDmrHost(configured?: string): string {
  return typeof configured === "string" && configured.trim() !== ""
    ? configured.trim()
    : DEFAULT_DMR_HOST;
}

// A port is usable only if it is a whole number in the valid TCP range;
// anything else (missing, string, out of range) falls back to the default.
export function resolveDmrPort(configured?: number): number {
  return typeof configured === "number" &&
    Number.isInteger(configured) &&
    configured > 0 &&
    configured < 65536
    ? configured
    : DEFAULT_DMR_PORT;
}

export function dmrBaseUrl(
  scheme: DmrScheme,
  host: string,
  port: number,
): string {
  return `${scheme}://${host}:${port}/engines/v1`;
}

// Resolved base URL of the Docker Model Runner API, honouring `dmrScheme`,
// `dmrHost` and `dmrPort` from ~/.paikea/config.json.
export function getDmrBaseUrl(): string {
  const config = loadConfig();
  return dmrBaseUrl(
    resolveDmrScheme(config.dmrScheme),
    resolveDmrHost(config.dmrHost),
    resolveDmrPort(config.dmrPort),
  );
}
