import { execSync } from "node:child_process";

let _available: boolean | null = null;

export function isRtkAvailable(): boolean {
  if (_available !== null) return _available;
  try {
    execSync("which rtk", { encoding: "utf-8", stdio: "pipe" });
    _available = true;
  } catch {
    _available = false;
  }
  return _available;
}

export function rtkExec(command: string, cwd: string): string {
  if (!isRtkAvailable()) {
    return rawExec(command, cwd);
  }
  return rawExec(`rtk ${command}`, cwd);
}

function rawExec(command: string, cwd: string): string {
  try {
    return execSync(command, {
      cwd,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    const err = error as { status?: number; stderr?: string; message?: string };
    return `Exit ${err.status ?? "?"}: ${err.stderr ?? err.message ?? "unknown error"}`;
  }
}

export interface RtkSavings {
  totalCommands: number;
  totalSaved: number;
  avgSavingsPct: number;
}

export function getRtkSavings(): RtkSavings | null {
  if (!isRtkAvailable()) return null;
  try {
    const raw = execSync("rtk gain --format json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const data = JSON.parse(raw) as {
      summary: {
        total_commands: number;
        total_saved: number;
        avg_savings_pct: number;
      };
    };
    return {
      totalCommands: data.summary.total_commands,
      totalSaved: data.summary.total_saved,
      avgSavingsPct: data.summary.avg_savings_pct,
    };
  } catch {
    return null;
  }
}

export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
