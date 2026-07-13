import { expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { Box, type DOMElement, render, Text } from "ink";
import { useEffect, useRef } from "react";
import { absolutePosition } from "../tui/dom-position";

// Minimal fake TTY stdout so Ink computes a real layout without a terminal.
function fakeStdout(columns = 80, rows = 24) {
  const stream = new EventEmitter() as unknown as NodeJS.WriteStream;
  Object.assign(stream, {
    columns,
    rows,
    isTTY: true,
    write: () => true,
  });
  return stream;
}

test("absolutePosition resolves a nested content box to absolute cells", async () => {
  const captured: Array<{ top: number; left: number }> = [];

  function Harness() {
    const ref = useRef<DOMElement | null>(null);
    useEffect(() => {
      if (ref.current) captured.push(absolutePosition(ref.current));
    });
    return (
      // Root column: a 1-row header, then a bordered pane whose content box
      // sits below the border (1) and a title row (1).
      <Box flexDirection="column">
        <Text>header</Text>
        <Box flexDirection="column" borderStyle="round">
          <Text>── title ──</Text>
          <Box flexDirection="column" ref={ref}>
            <Text>first response line</Text>
            <Text>second response line</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  const app = render(<Harness />, {
    stdout: fakeStdout(),
    patchConsole: false,
  });
  // Let the effect run after layout is committed.
  await new Promise((resolve) => setTimeout(resolve, 20));
  app.unmount();

  // header row 0; border row 1; title row 2; content starts at row 3.
  // Left border occupies column 0, so content starts at column 1.
  expect(captured.at(-1)).toEqual({ top: 3, left: 1 });
});
