import { render } from "ink";
import { App } from "./App";

export function startTUI() {
  const { waitUntilExit } = render(<App />, {
    exitOnCtrlC: true,
    patchConsole: false,
  });

  return waitUntilExit().then(() => {
    process.stdout.write("\x1b[2J\x1b[H");
  });
}
