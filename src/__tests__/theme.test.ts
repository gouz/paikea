import { describe, expect, it } from "bun:test";
import {
  getCurrentTheme,
  getThemeNames,
  getThemes,
  setThemeByName,
  symbols,
  t,
} from "../tui/theme";

const REQUIRED_FG = [
  "primary",
  "secondary",
  "dim",
  "accent",
  "success",
  "warning",
  "error",
  "thinking",
  "muted",
] as const;
const REQUIRED_BG = [
  "header",
  "panel",
  "panelAlt",
  "status",
  "input",
  "thinking",
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

describe("Marine theme registry", () => {
  it("ships exactly the five marine themes", () => {
    expect(getThemeNames()).toEqual([
      "deep-sea",
      "dawn",
      "storm",
      "lagoon",
      "polar-night",
    ]);
  });

  it("every theme fills the ThemeColors contract with valid hex", () => {
    for (const theme of getThemes()) {
      for (const key of REQUIRED_FG) {
        expect(theme.colors.fg[key]).toMatch(HEX);
      }
      for (const key of REQUIRED_BG) {
        expect(theme.colors.bg[key]).toMatch(HEX);
      }
    }
  });

  it("defaults to deep-sea", () => {
    expect(getCurrentTheme().name).toBe("deep-sea");
  });

  it("switches to a known theme", () => {
    const theme = setThemeByName("lagoon");
    expect(theme?.name).toBe("lagoon");
    expect(getCurrentTheme().name).toBe("lagoon");
    // restore default for other tests
    setThemeByName("deep-sea");
  });

  it("falls back to deep-sea for an unknown (removed) theme name", () => {
    setThemeByName("deep-sea");
    const result = setThemeByName("dracula");
    expect(result).toBeNull();
    // active theme is unchanged — the deep-sea default is retained
    expect(getCurrentTheme().name).toBe("deep-sea");
    expect(t().fg.accent).toBe("#4dd0e1");
  });
});

describe("Nautical symbols", () => {
  it("uses single-cell nautical glyphs", () => {
    expect([...symbols.bullet]).toHaveLength(1);
    expect([...symbols.divider]).toHaveLength(1);
    expect([...symbols.arrow]).toHaveLength(1);
    expect([...symbols.gear]).toHaveLength(1);
  });

  it("has a multi-frame swell spinner", () => {
    expect(symbols.spinner.length).toBeGreaterThan(1);
    for (const frame of symbols.spinner) {
      expect([...frame]).toHaveLength(1);
    }
  });
});
