export interface ThemeColors {
  fg: {
    primary: string;
    secondary: string;
    dim: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    thinking: string;
    muted: string;
  };
  bg: {
    header: string;
    panel: string;
    panelAlt: string;
    status: string;
    input: string;
    thinking: string;
  };
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

const themes: Theme[] = [
  {
    name: "dark",
    colors: {
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
    },
  },
  {
    name: "light",
    colors: {
      fg: {
        primary: "#1a1a2e",
        secondary: "#6c7a89",
        dim: "#a0aec0",
        accent: "#2b6cb0",
        success: "#276749",
        warning: "#b7791f",
        error: "#c53030",
        thinking: "#553c9a",
        muted: "#718096",
      },
      bg: {
        header: "#f7fafc",
        panel: "#edf2f7",
        panelAlt: "#e2e8f0",
        status: "#f7fafc",
        input: "#edf2f7",
        thinking: "#eef0f7",
      },
    },
  },
  {
    name: "nord",
    colors: {
      fg: {
        primary: "#eceff4",
        secondary: "#616e88",
        dim: "#4c566a",
        accent: "#88c0d0",
        success: "#a3be8c",
        warning: "#ebcb8b",
        error: "#bf616a",
        thinking: "#b48ead",
        muted: "#7b88a1",
      },
      bg: {
        header: "#2e3440",
        panel: "#3b4252",
        panelAlt: "#434c5e",
        status: "#2e3440",
        input: "#3b4252",
        thinking: "#353c4a",
      },
    },
  },
  {
    name: "dracula",
    colors: {
      fg: {
        primary: "#f8f8f2",
        secondary: "#6272a4",
        dim: "#44475a",
        accent: "#bd93f9",
        success: "#50fa7b",
        warning: "#f1fa8c",
        error: "#ff5555",
        thinking: "#ff79c6",
        muted: "#8394a2",
      },
      bg: {
        header: "#282a36",
        panel: "#2d303e",
        panelAlt: "#343746",
        status: "#282a36",
        input: "#2d303e",
        thinking: "#2a2d3b",
      },
    },
  },
  {
    name: "tokyonight",
    colors: {
      fg: {
        primary: "#c0caf5",
        secondary: "#565f89",
        dim: "#414868",
        accent: "#7aa2f7",
        success: "#9ece6a",
        warning: "#e0af68",
        error: "#f7768e",
        thinking: "#bb9af7",
        muted: "#787c99",
      },
      bg: {
        header: "#1a1b26",
        panel: "#1f2335",
        panelAlt: "#24283b",
        status: "#1a1b26",
        input: "#1f2335",
        thinking: "#1e2030",
      },
    },
  },
];

let currentThemeIndex = 0;

export function getThemes(): Theme[] {
  return themes;
}

export function getCurrentTheme(): Theme {
  const theme = themes[currentThemeIndex];
  if (theme) return theme;
  const fallback = themes[0];
  if (fallback) return fallback;
  return {
    name: "dark",
    colors: {
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
    },
  };
}

export function setThemeByName(name: string): Theme | null {
  const idx = themes.findIndex((t) => t.name === name);
  if (idx === -1) return null;
  currentThemeIndex = idx;
  return themes[idx] ?? null;
}

export function getThemeNames(): string[] {
  return themes.map((t) => t.name);
}

export function t(): ThemeColors {
  const theme = themes[currentThemeIndex];
  if (theme) return theme.colors;
  const fallback = themes[0];
  if (fallback) return fallback.colors;
  return {
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
}

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
