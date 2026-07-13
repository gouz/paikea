import type { Terminal } from "@hexie/tui";
import { drawFrise } from "../renderer/draw";
import type { Layout } from "../renderer/layout";
import { theme } from "../renderer/theme";

export function renderHeader(
  term: Terminal,
  layout: Layout,
  modelName: string,
) {
  const { row, width } = layout.header;

  // Dark background
  for (let c = 0; c < width; c++) {
    term.putChar(row, c, " ", { bg: theme.bg.header });
  }

  // Title
  term.putText(row, 1, "🏄 paikea", {
    bold: true,
    fg: theme.fg.accent,
    bg: theme.bg.header,
  });

  // Model pill
  const pill = ` ${theme.symbols.gear} ${modelName} `;
  term.putText(row, 12, pill, {
    fg: theme.fg.primary,
    bg: theme.bg.panel,
  });

  // Shortcuts hint
  const hint = "enter send · tab model · ↑ tools · : palette · esc quit";
  term.putText(row, width - hint.length - 1, hint, {
    fg: theme.fg.dim,
    bg: theme.bg.header,
  });

  // Frise below header (row 1)
  if (layout.header.height >= 1) {
    drawFrise(term, row + 1, 0, width);
  }
}
