import type { Terminal } from "@hexie/tui";
import type { Layout } from "../renderer/layout";
import { theme } from "../renderer/theme";

interface ToolbarButton {
  label: string;
  id: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { label: "⚙ Model", id: "model" },
  { label: "💭 Thinking", id: "thinking" },
  { label: "🗑 Clear", id: "clear" },
  { label: "📋 Palette", id: "palette" },
];

export function renderStatusBar(
  term: Terminal,
  layout: Layout,
  _modelName: string,
  tokens: number,
  streaming: boolean,
  toolbarIndex: number,
  isToolbarMode: boolean,
) {
  const { row, width } = layout.status;

  // Dark background
  for (let c = 0; c < width; c++) {
    term.putChar(row, c, " ", { bg: theme.bg.status });
  }

  // Left: token count
  const tokenText = ` tokens ${tokens}`;
  term.putText(row, 1, tokenText, {
    fg: theme.fg.dim,
    bg: theme.bg.status,
  });

  // Center: toolbar buttons (when not streaming)
  if (!streaming) {
    const buttonsStart = Math.floor(width / 2 - 20);
    let offset = buttonsStart;

    for (let i = 0; i < TOOLBAR_BUTTONS.length; i++) {
      const btn = TOOLBAR_BUTTONS[i];
      const isSelected = isToolbarMode && i === toolbarIndex;

      // Button background
      const btnText = ` ${btn.label} `;
      for (let c = offset; c < offset + btnText.length; c++) {
        term.putChar(row, c, " ", {
          bg: isSelected ? theme.bg.panelAlt : theme.bg.status,
        });
      }

      term.putText(row, offset, btnText, {
        fg: isSelected ? theme.fg.accent : theme.fg.dim,
        bg: isSelected ? theme.bg.panelAlt : theme.bg.status,
        bold: isSelected,
      });

      offset += btnText.length + 1;
    }
  } else {
    // Streaming indicator
    const spinner =
      theme.symbols.spinner[
        Math.floor(Date.now() / 100) % theme.symbols.spinner.length
      ];
    const streamText = ` ${spinner} streaming `;
    term.putText(
      row,
      Math.floor(width / 2 - streamText.length / 2),
      streamText,
      {
        fg: theme.fg.accent,
        bg: theme.bg.status,
        bold: true,
      },
    );
  }

  // Right: mode hint
  let rightText = "";
  if (streaming) {
    rightText = "";
  } else if (isToolbarMode) {
    rightText = " Tab/Enter ";
  } else {
    rightText = " : palette ";
  }
  term.putText(row, width - rightText.length - 1, rightText, {
    fg: theme.fg.dim,
    bg: theme.bg.status,
  });
}

export function getToolbarActions(): ToolbarButton[] {
  return TOOLBAR_BUTTONS;
}
