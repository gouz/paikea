import type { Attributes, Terminal } from "@hexie/tui";
import { FRISE_CHARS, friseColor, theme } from "./theme";

export function drawBox(
  term: Terminal,
  row: number,
  col: number,
  width: number,
  height: number,
  title?: string,
  attrs?: Attributes,
) {
  const box = theme.box;
  const style: Attributes = { fg: theme.fg.dim, ...attrs };

  term.putChar(row, col, box.topLeft, style);
  for (let i = 1; i < width - 1; i++) {
    term.putChar(row, col + i, box.horizontal, style);
  }
  term.putChar(row, col + width - 1, box.topRight, style);

  if (title) {
    const titleText = ` ${title} `;
    const startCol = col + Math.floor((width - titleText.length) / 2);
    term.putText(row, startCol, titleText, { fg: theme.fg.accent, bold: true });
  }

  for (let r = 1; r < height - 1; r++) {
    term.putChar(row + r, col, box.vertical, style);
    term.putChar(row + r, col + width - 1, box.vertical, style);
  }

  term.putChar(row + height - 1, col, box.bottomLeft, style);
  for (let i = 1; i < width - 1; i++) {
    term.putChar(row + height - 1, col + i, box.horizontal, style);
  }
  term.putChar(row + height - 1, col + width - 1, box.bottomRight, style);
}

export function drawPanel(
  term: Terminal,
  row: number,
  col: number,
  width: number,
  height: number,
  bg?: typeof theme.bg.panel,
) {
  const bgColor = bg ?? theme.bg.panel;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      term.putChar(row + r, col + c, " ", { bg: bgColor });
    }
  }
}

export function drawFrise(
  term: Terminal,
  row: number,
  col: number,
  width: number,
) {
  for (let c = 0; c < width; c++) {
    const _paletteIdx = Math.floor(c * friseColor(c).toString().length) % 6;
    const charIdx = c % FRISE_CHARS.length;
    const color = friseColor(c);
    term.putChar(row, col + c, FRISE_CHARS[charIdx] ?? "░", {
      fg: color,
    });
  }
}

export function drawSectionLabel(
  term: Terminal,
  row: number,
  col: number,
  label: string,
  color?: typeof theme.fg.accent,
) {
  const c = color ?? theme.fg.muted;
  term.putText(row, col, `── ${label} `, { fg: c });
  const labelEnd = col + label.length + 5;
  for (let i = 0; i < 20; i++) {
    term.putChar(row, labelEnd + i, "─", { fg: theme.fg.dim, dim: true });
  }
}

export function drawTextWrapped(
  term: Terminal,
  row: number,
  col: number,
  width: number,
  text: string,
  attrs?: Attributes,
): number {
  const style: Attributes = { ...attrs };
  let currentRow = row;
  let currentCol = col;
  let line = "";

  for (const char of text) {
    if (char === "\n") {
      term.putText(currentRow, currentCol, line, style);
      currentRow++;
      currentCol = col;
      line = "";
      continue;
    }

    line += char;
    if (line.length >= width - 1) {
      term.putText(currentRow, currentCol, line, style);
      currentRow++;
      currentCol = col;
      line = "";
    }
  }

  if (line) {
    term.putText(currentRow, currentCol, line, style);
    currentRow++;
  }

  return currentRow;
}

export function clearArea(
  term: Terminal,
  row: number,
  col: number,
  width: number,
  height: number,
) {
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      term.putChar(row + r, col + c, " ");
    }
  }
}
