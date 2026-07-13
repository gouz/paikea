import { Clipse } from "clipse";
import { docHandler } from "./commands/doc";
import { initHandler } from "./commands/init";
import { obsidianHandler } from "./commands/obsidian";
import { runHandler } from "./commands/run";

const initCmd = new Clipse(
  "init",
  "Initialize a new paikea project with devcontainer + OpenSpec",
);
initCmd.action(() => initHandler());

const docCmd = new Clipse(
  "doc",
  "Generate Diátaxis documentation (tutorials, how-to, reference, explanation)",
);
docCmd.addOptions({
  output: {
    short: "o",
    type: "string",
    description: "Output directory for documentation",
    default: "./docs",
  },
  scope: {
    short: "s",
    type: "string",
    description: "Scope: 'all', 'src', or specific path",
    default: "src",
  },
});
docCmd.action((_a, _o) => docHandler(_o as { output: string; scope: string }));

const obsidianCmd = new Clipse(
  "obsidian",
  "Open the project vault in Obsidian (syncs OpenSpec specs first)",
);
obsidianCmd.action(() => obsidianHandler());

const cli = new Clipse(
  "paikea",
  "🏄 Paikea — AI CLI agent powered by local LLMs",
  "0.1.0",
);

cli
  .addSubcommands([initCmd, docCmd, obsidianCmd])
  .action(() => runHandler())
  .ready();
