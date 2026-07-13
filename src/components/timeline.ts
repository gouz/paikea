import type { Terminal } from "@hexie/tui";
import type { Layout } from "../renderer/layout";
import { theme } from "../renderer/theme";
import type { Step } from "../types";

export function renderTimeline(term: Terminal, layout: Layout, steps: Step[]) {
  const { row, width } = layout.timeline;

  // Clear
  for (let c = 0; c < width; c++) {
    term.putChar(row, c, " ");
  }

  let col = 2;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step) continue;

    // Symbol
    if (step.status === "done") {
      term.putChar(row, col, theme.symbols.bullet, { fg: theme.fg.success });
    } else if (step.status === "current") {
      term.putChar(row, col, theme.symbols.bullet, {
        fg: theme.fg.accent,
        bold: true,
      });
    } else {
      term.putChar(row, col, theme.symbols.empty, { fg: theme.fg.dim });
    }

    col += 2;

    // Name
    const nameAttrs: { fg: typeof theme.fg.primary; bold?: boolean } =
      step.status === "current"
        ? { fg: theme.fg.accent, bold: true }
        : step.status === "done"
          ? { fg: theme.fg.success }
          : { fg: theme.fg.dim };

    term.putText(row, col, step.name, nameAttrs);
    col += step.name.length;

    // Divider
    if (i < steps.length - 1) {
      term.putChar(row, col, " ");
      col += 1;
      term.putChar(row, col, theme.symbols.divider, { fg: theme.fg.dim });
      col += 1;
      term.putChar(row, col, theme.symbols.divider, { fg: theme.fg.dim });
      col += 1;
      term.putChar(row, col, theme.symbols.divider, { fg: theme.fg.dim });
      col += 1;
      term.putChar(row, col, " ");
      col += 1;
    }
  }
}
