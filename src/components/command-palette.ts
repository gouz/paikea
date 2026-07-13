import type { Terminal } from "@hexie/tui";
import { theme } from "../renderer/theme";
import type { Action } from "../types";

export function renderCommandPalette(
  term: Terminal,
  actions: Action[],
  selectedIndex: number,
  rows: number,
  cols: number,
) {
  const paletteHeight = Math.min(actions.length + 2, rows - 4);
  const paletteWidth = Math.min(40, cols - 4);
  const startRow = Math.floor((rows - paletteHeight) / 2);
  const startCol = Math.floor((cols - paletteWidth) / 2);

  // Background overlay
  for (let r = startRow; r < startRow + paletteHeight; r++) {
    for (let c = startCol; c < startCol + paletteWidth; c++) {
      term.putChar(r, c, " ", { bg: theme.bg.panelAlt });
    }
  }

  // Title
  const title = " Actions ";
  term.putText(
    startRow,
    startCol + Math.floor((paletteWidth - title.length) / 2),
    title,
    { fg: theme.fg.accent, bg: theme.bg.panelAlt, bold: true },
  );

  // Separator
  for (let c = startCol; c < startCol + paletteWidth; c++) {
    term.putChar(startRow + 1, c, "─", {
      fg: theme.fg.dim,
      bg: theme.bg.panelAlt,
    });
  }

  // Actions list
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const row = startRow + 2 + i;
    const isSelected = i === selectedIndex;

    // Background
    for (let c = startCol; c < startCol + paletteWidth; c++) {
      term.putChar(row, c, " ", {
        bg: isSelected ? theme.bg.status : theme.bg.panelAlt,
      });
    }

    // Selection indicator
    const prefix = isSelected ? "❯ " : "  ";
    term.putText(row, startCol + 1, prefix, {
      fg: isSelected ? theme.fg.accent : theme.fg.dim,
      bg: isSelected ? theme.bg.status : theme.bg.panelAlt,
    });

    // Action label
    term.putText(row, startCol + 3, action.label, {
      fg: isSelected ? theme.fg.primary : theme.fg.secondary,
      bg: isSelected ? theme.bg.status : theme.bg.panelAlt,
    });

    // Shortcut
    if (action.shortcut) {
      term.putText(
        row,
        startCol + paletteWidth - action.shortcut.length - 2,
        action.shortcut,
        {
          fg: theme.fg.dim,
          bg: isSelected ? theme.bg.status : theme.bg.panelAlt,
        },
      );
    }
  }
}
