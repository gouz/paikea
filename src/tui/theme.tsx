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

// Marine palettes. Semantic mapping is kept consistent across every theme:
//   accent = sea/sky blue-teal · success = seaweed green ·
//   warning = lighthouse amber · error = coral red · thinking = bioluminescence
const themes: Theme[] = [
  {
    name: "deep-sea",
    colors: {
      fg: {
        primary: "#dceefb",
        secondary: "#7fa8c9",
        dim: "#3d5a73",
        accent: "#4dd0e1",
        success: "#6fcf97",
        warning: "#f2c14e",
        error: "#ff6b6b",
        thinking: "#9d8cf0",
        muted: "#567a94",
      },
      bg: {
        header: "#061620",
        panel: "#0a2230",
        panelAlt: "#0e2c3d",
        status: "#061620",
        input: "#0a2230",
        thinking: "#0c1e2e",
      },
    },
  },
  {
    name: "dawn",
    colors: {
      fg: {
        primary: "#123047",
        secondary: "#4a708c",
        dim: "#9db8c9",
        accent: "#0277bd",
        success: "#2e8b57",
        warning: "#b8860b",
        error: "#c0392b",
        thinking: "#5b4b9c",
        muted: "#6d8ba0",
      },
      bg: {
        header: "#eef4f2",
        panel: "#e3ecec",
        panelAlt: "#d6e3e3",
        status: "#eef4f2",
        input: "#e3ecec",
        thinking: "#e8eef2",
      },
    },
  },
  {
    name: "storm",
    colors: {
      fg: {
        primary: "#e6ebef",
        secondary: "#8b9caa",
        dim: "#4a5a68",
        accent: "#7fb3c9",
        success: "#7fb891",
        warning: "#f4a259",
        error: "#e85d5d",
        thinking: "#b0a4d4",
        muted: "#6b7b89",
      },
      bg: {
        header: "#12181d",
        panel: "#1b242c",
        panelAlt: "#232f39",
        status: "#12181d",
        input: "#1b242c",
        thinking: "#18222b",
      },
    },
  },
  {
    name: "lagoon",
    colors: {
      fg: {
        primary: "#e0f7f4",
        secondary: "#6fb3ab",
        dim: "#2f5f5a",
        accent: "#26c6da",
        success: "#4dd6a0",
        warning: "#ffd166",
        error: "#ff7a6b",
        thinking: "#b088e0",
        muted: "#4f8a83",
      },
      bg: {
        header: "#041c1f",
        panel: "#06282b",
        panelAlt: "#093437",
        status: "#041c1f",
        input: "#06282b",
        thinking: "#08262a",
      },
    },
  },
  {
    name: "polar-night",
    colors: {
      fg: {
        primary: "#eaf1f8",
        secondary: "#7d97b3",
        dim: "#3b4d63",
        accent: "#7fb0d4",
        success: "#8fc0a9",
        warning: "#e8c37e",
        error: "#e07a8a",
        thinking: "#a99cd6",
        muted: "#63788f",
      },
      bg: {
        header: "#0a0f18",
        panel: "#10161f",
        panelAlt: "#161e2a",
        status: "#0a0f18",
        input: "#10161f",
        thinking: "#0e1521",
      },
    },
  },
];

// deep-sea is the default (index 0) — the fallback below mirrors it.
const FALLBACK: ThemeColors = {
  fg: {
    primary: "#dceefb",
    secondary: "#7fa8c9",
    dim: "#3d5a73",
    accent: "#4dd0e1",
    success: "#6fcf97",
    warning: "#f2c14e",
    error: "#ff6b6b",
    thinking: "#9d8cf0",
    muted: "#567a94",
  },
  bg: {
    header: "#061620",
    panel: "#0a2230",
    panelAlt: "#0e2c3d",
    status: "#061620",
    input: "#0a2230",
    thinking: "#0c1e2e",
  },
};

let currentThemeIndex = 0;

export function getThemes(): Theme[] {
  return themes;
}

export function getCurrentTheme(): Theme {
  const theme = themes[currentThemeIndex];
  if (theme) return theme;
  const fallback = themes[0];
  if (fallback) return fallback;
  return { name: "deep-sea", colors: FALLBACK };
}

export function setThemeByName(name: string): Theme | null {
  const idx = themes.findIndex((theme) => theme.name === name);
  if (idx === -1) return null;
  currentThemeIndex = idx;
  return themes[idx] ?? null;
}

export function getThemeNames(): string[] {
  return themes.map((theme) => theme.name);
}

export function t(): ThemeColors {
  const theme = themes[currentThemeIndex];
  if (theme) return theme.colors;
  const fallback = themes[0];
  if (fallback) return fallback.colors;
  return FALLBACK;
}

// Nautical iconography. Every glyph is a single terminal cell wide so it can be
// dropped into existing layouts without shifting column alignment.
export const symbols = {
  bullet: "⚓", // anchor — active marker
  empty: "○", // buoy ring — inactive
  divider: "~", // wave — inline separator
  dot: "◦", // small buoy
  arrow: "»", // course / heading
  spinner: ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "▆", "▅", "▄", "▃", "▂"], // swell
  check: "✓",
  cross: "✗",
  gear: "⎈", // helm wheel
};
