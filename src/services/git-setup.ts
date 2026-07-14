import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Initialize a git repository in the project and create an initial commit
// with all the freshly scaffolded files. No-op if the directory is already a
// repo, so re-running init on an existing project stays safe.
export function initGitRepo(projectDir: string): void {
  try {
    if (existsSync(join(projectDir, ".git"))) return;

    const run = (cmd: string) =>
      execSync(cmd, { cwd: projectDir, stdio: "ignore" });

    run("git init -b main");
    run("git add -A");

    // Commit with a per-command identity fallback so the initial commit works
    // even when the user has no global git user.name/user.email configured.
    execSync(
      'git -c user.name=paikea -c user.email=paikea@localhost commit -m ":tada: feat: initial commit"',
      { cwd: projectDir, stdio: "ignore" },
    );
  } catch (_err) {
    console.warn(
      "Warning: git repository initialization failed. You can do it manually:",
    );
    console.warn("  cd your-project && git init && git add -A && git commit");
  }
}
