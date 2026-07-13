import type { Terminal } from "@hexie/tui";
import { drawPanel, drawSectionLabel, drawTextWrapped } from "../renderer/draw";
import type { Layout } from "../renderer/layout";
import { theme } from "../renderer/theme";

export function renderThinkingPane(
  term: Terminal,
  layout: Layout,
  content: string,
  visible: boolean,
) {
  if (!visible) return;

  const { row, col, width, height } = layout.thinking;
  if (height === 0) return;

  // Background
  drawPanel(term, row, col, width, height, theme.bg.thinking);

  // Section label
  drawSectionLabel(term, row, col, "thinking", theme.fg.thinking);

  if (content) {
    const lines = content.split("\n");
    const visibleLines = lines.slice(0, height - 2);
    const contentWidth = width - 4;

    for (let i = 0; i < visibleLines.length; i++) {
      const line = visibleLines[i] ?? "";
      drawTextWrapped(term, row + 1 + i, col + 2, contentWidth, line, {
        fg: theme.fg.thinking,
      });
    }
  } else {
    const spinner =
      theme.symbols.spinner[
        Math.floor(Date.now() / 100) % theme.symbols.spinner.length
      ];
    term.putText(row + 1, col + 2, `${spinner} thinking...`, {
      fg: theme.fg.thinking,
    });
  }
}
