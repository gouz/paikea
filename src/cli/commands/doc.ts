import { basename } from "node:path";
import { intro, outro, spinner } from "@clack/prompts";
import {
  type DiataxisConfig,
  generateDiataxisDocs,
} from "../../services/doc-generator";

export async function docHandler(opts: { output: string; scope: string }) {
  intro("🏄 paikea doc — Diátaxis documentation");

  const config: DiataxisConfig = {
    outputDir: opts.output,
    scope: opts.scope,
    projectName: basename(process.cwd()),
  };

  const s = spinner();
  s.start("Generating Diátaxis documentation...");

  try {
    generateDiataxisDocs(config);
    s.stop("Documentation generated!");
  } catch (err) {
    s.stop("Error generating documentation");
    console.error(err);
  }

  outro(`Documentation written to: ${opts.output}/`);
}
