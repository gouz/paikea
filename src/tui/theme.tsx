export const colors = {
  fg: {
    primary: "#e0e0e0",
    secondary: "#8a8a8a",
    dim: "#555555",
    accent: "#45b7d1",
    success: "#6bcb77",
    warning: "#ffc93c",
    error: "#ff6b6b",
    thinking: "#a29bfe",
    muted: "#636e72",
  },
  bg: {
    header: "#0d1117",
    panel: "#161b22",
    panelAlt: "#1c2333",
    status: "#0d1117",
    input: "#161b22",
    thinking: "#1a1530",
  },
};

export const symbols = {
  bullet: "●",
  empty: "○",
  divider: "·",
  dot: "•",
  arrow: "→",
  spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  check: "✓",
  cross: "✗",
  gear: "⚙",
};

const FRISE_PALETTE = [
  "#ff6b6b",
  "#ff8e53",
  "#ffc93c",
  "#6bcb77",
  "#4ecdc4",
  "#45b7d1",
  "#6c5ce7",
  "#a29bfe",
  "#fd79a8",
  "#e17055",
];

export function friseColor(index: number): string {
  return (
    FRISE_PALETTE[index % FRISE_PALETTE.length] ?? FRISE_PALETTE[0] ?? "#ffffff"
  );
}

export const FRISE_CHARS = ["░", "▒", "▓", "█", "▓", "▒", "░"];
