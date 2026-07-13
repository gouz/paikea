import type { Terminal } from "@hexie/tui";
import { drawPanel } from "../renderer/draw";
import type { Layout } from "../renderer/layout";
import { theme } from "../renderer/theme";

export function renderPromptInput(
  term: Terminal,
  layout: Layout,
  prompt: string,
  cursorPos: number,
  focused: boolean,
  suggestions: string[],
  suggestionIndex: number,
) {
  const { row, col, width, height } = layout.input;

  // Subtle background
  drawPanel(term, row, col, width, height, theme.bg.input);

  // Top border line
  const lineColor = focused ? theme.fg.accent : theme.fg.dim;
  for (let c = 0; c < width; c++) {
    term.putChar(row, col + c, "─", { fg: lineColor, dim: true });
  }

  // Prompt prefix
  const prefix = "❯ ";
  term.putText(row + 1, col + 1, prefix, {
    fg: theme.fg.accent,
    bold: true,
  });

  // Input text
  const displayText = prompt || "";
  const maxChars = width - 6;
  const visibleText = displayText.slice(0, maxChars);

  if (visibleText) {
    term.putText(row + 1, col + 3, visibleText, {
      fg: theme.fg.primary,
    });
  } else {
    // Placeholder
    term.putText(row + 1, col + 3, "type your prompt...", {
      fg: theme.fg.dim,
    });
  }

  // Cursor
  if (focused) {
    const cursorCol = col + 3 + Math.min(cursorPos, maxChars);
    term.putChar(row + 1, cursorCol, "█", { fg: theme.fg.accent });
  }

  // Suggestion (bottom row)
  const suggestion =
    suggestionIndex >= 0 ? suggestions[suggestionIndex] : suggestions[0];

  if (suggestion && focused) {
    // Show suggestion as ghost text after the prompt
    const suggestionRow = row + 2;
    const remaining = suggestion.slice(prompt.length);
    if (remaining) {
      term.putText(suggestionRow, col + 3, remaining, {
        fg: theme.fg.dim,
        italic: true,
      });
    }

    // Tab hint
    const tabHint = "tab →";
    term.putText(suggestionRow, col + width - tabHint.length - 1, tabHint, {
      fg: theme.fg.dim,
      dim: true,
    });
  } else {
    // Default hint
    const hint = "Enter to send";
    term.putText(row + 2, col + width - hint.length - 1, hint, {
      fg: theme.fg.dim,
      dim: true,
    });
  }
}
