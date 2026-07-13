import type { Attributes, Terminal } from "@hexie/tui";
import { drawPanel, drawSectionLabel, drawTextWrapped } from "../renderer/draw";
import type { Layout } from "../renderer/layout";
import { theme } from "../renderer/theme";

export function renderResultPane(
  term: Terminal,
  layout: Layout,
  content: string,
  scrollOffset: number,
) {
  const { row, col, width, height } = layout.result;

  // Subtle background
  drawPanel(term, row, col, width, height, theme.bg.panel);

  // Section label
  drawSectionLabel(term, row, col, "response", theme.fg.accent);

  if (content) {
    const lines = content.split("\n");
    const visibleLines = lines.slice(scrollOffset, scrollOffset + height - 2);
    const contentWidth = width - 4;

    for (let i = 0; i < visibleLines.length; i++) {
      const line = visibleLines[i] ?? "";
      let displayLine = line;
      let attrs: Attributes = { fg: theme.fg.primary };

      // Headers
      if (line.startsWith("# ")) {
        displayLine = line.slice(2);
        attrs = { fg: theme.fg.accent, bold: true };
      } else if (line.startsWith("## ")) {
        displayLine = line.slice(3);
        attrs = { fg: theme.fg.accent };
      } else if (line.startsWith("### ")) {
        displayLine = line.slice(4);
        attrs = { fg: theme.fg.warning };
      }
      // Bold
      else if (line.startsWith("**") && line.endsWith("**")) {
        displayLine = line.slice(2, -2);
        attrs = { bold: true };
      }
      // Code block
      else if (line.startsWith("```")) {
        attrs = { fg: theme.fg.dim };
      }
      // List
      else if (line.startsWith("- ")) {
        displayLine = `  ${theme.symbols.dot} ${line.slice(2)}`;
        attrs = { fg: theme.fg.secondary };
      }
      // Numbered list
      else if (/^\d+\.\s/.test(line)) {
        attrs = { fg: theme.fg.secondary };
      }

      drawTextWrapped(
        term,
        row + 1 + i,
        col + 2,
        contentWidth,
        displayLine,
        attrs,
      );
    }
  } else {
    const spinner =
      theme.symbols.spinner[
        Math.floor(Date.now() / 100) % theme.symbols.spinner.length
      ];
    term.putText(row + 1, col + 2, `${spinner} awaiting response...`, {
      fg: theme.fg.dim,
    });
  }
}
