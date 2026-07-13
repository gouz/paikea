import type { Color } from "@hexie/tui";

// Gradient palette for the frise
const FRISE_PALETTE: Color[] = [
  "#ff6b6b" as Color,
  "#ff8e53" as Color,
  "#ffc93c" as Color,
  "#6bcb77" as Color,
  "#4ecdc4" as Color,
  "#45b7d1" as Color,
  "#6c5ce7" as Color,
  "#a29bfe" as Color,
  "#fd79a8" as Color,
  "#e17055" as Color,
];

export function friseColor(index: number): Color {
  return FRISE_PALETTE[index % FRISE_PALETTE.length] ?? FRISE_PALETTE[0];
}

export const FRISE_CHARS = ["░", "▒", "▓", "█", "▓", "▒", "░"];

export const theme = {
  fg: {
    primary: "#e0e0e0" as Color,
    secondary: "#8a8a8a" as Color,
    dim: "#555555" as Color,
    accent: "#45b7d1" as Color,
    success: "#6bcb77" as Color,
    warning: "#ffc93c" as Color,
    error: "#ff6b6b" as Color,
    thinking: "#a29bfe" as Color,
    muted: "#636e72" as Color,
  },
  bg: {
    header: "#0d1117" as Color,
    panel: "#161b22" as Color,
    panelAlt: "#1c2333" as Color,
    status: "#0d1117" as Color,
    input: "#161b22" as Color,
    thinking: "#1a1530" as Color,
  },
  symbols: {
    bullet: "●",
    empty: "○",
    divider: "·",
    dot: "•",
    arrow: "→",
    spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    check: "✓",
    cross: "✗",
    gear: "⚙",
  },
  box: {
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    horizontal: "─",
    vertical: "│",
  },
};
