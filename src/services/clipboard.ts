import { spawn } from "node:child_process";

// Ordered list of copy commands to try per platform. The first one that
// launches without an immediate error wins; the rest are fallbacks for the
// grab-bag of Linux clipboard tools a user might have installed.
function clipboardCommands(): Array<{ cmd: string; args: string[] }> {
  switch (process.platform) {
    case "darwin":
      return [{ cmd: "pbcopy", args: [] }];
    case "win32":
      return [{ cmd: "clip", args: [] }];
    default:
      return [
        { cmd: "wl-copy", args: [] },
        { cmd: "xclip", args: ["-selection", "clipboard"] },
        { cmd: "xsel", args: ["--clipboard", "--input"] },
      ];
  }
}

// Pipe `text` into the first available clipboard command. Best-effort: resolves
// true once a command accepts the write, false if every candidate is missing.
export function copyToClipboard(text: string): Promise<boolean> {
  const candidates = clipboardCommands();

  return new Promise((resolve) => {
    const tryNext = (index: number) => {
      const candidate = candidates[index];
      if (!candidate) {
        resolve(false);
        return;
      }

      let settled = false;
      const child = spawn(candidate.cmd, candidate.args, {
        stdio: ["pipe", "ignore", "ignore"],
      });

      // ENOENT (tool not installed) — move on to the next candidate.
      child.on("error", () => {
        if (settled) return;
        settled = true;
        tryNext(index + 1);
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        resolve(code === 0);
      });

      child.stdin.on("error", () => {
        // The 'error'/'close' handlers above own resolution.
      });
      child.stdin.end(text);
    };

    tryNext(0);
  });
}
