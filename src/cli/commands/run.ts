import { outro } from "@clack/prompts";
import { listModels } from "../../services/dmr-client";
import { startTUI } from "./tui-main";

export async function runHandler() {
  const models = await listModels();

  if (models.length === 0) {
    outro(
      "Docker Model Runner not reachable or no models found.\n\n" +
        "  1. Ensure Docker Desktop is running with Model Runner enabled\n" +
        "  2. Pull a model: docker model pull ai/qwen3\n\n" +
        "  Docs: https://docs.docker.com/desktop/features/model-runner/",
    );
    process.exit(1);
  }

  await startTUI();
}
