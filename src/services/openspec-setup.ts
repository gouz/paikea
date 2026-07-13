import { execSync } from "node:child_process";

export async function installOpenSpec(projectDir: string): Promise<void> {
  try {
    // Install openspec globally if not present
    try {
      execSync("openspec --version", { stdio: "ignore" });
    } catch {
      execSync("npm install -g @fission-ai/openspec@latest", {
        stdio: "ignore",
      });
    }

    // Initialize openspec in the project
    execSync("openspec init --force --tools none", {
      cwd: projectDir,
      stdio: "ignore",
    });
  } catch (_err) {
    console.warn(
      "Warning: OpenSpec installation failed. You can install it manually:",
    );
    console.warn("  npm install -g @fission-ai/openspec@latest");
    console.warn("  cd your-project && openspec init");
  }
}
