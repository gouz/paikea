import { Box, Text } from "ink";
import type { Action } from "../../types";
import { useTerminalSize } from "../hooks/use-terminal";
import { t } from "../theme";

const PALETTE_WIDTH = 40;

interface CommandPaletteProps {
  actions: Action[];
  selectedIndex: number;
}

export function CommandPalette({
  actions,
  selectedIndex,
}: CommandPaletteProps) {
  const { columns, rows } = useTerminalSize();
  const height = actions.length + 4;
  const left = Math.max(0, Math.floor((columns - PALETTE_WIDTH) / 2));
  const top = Math.max(0, Math.floor((rows - height) / 2));

  return (
    <Box
      flexDirection="column"
      position="absolute"
      left={left}
      top={top}
      width={PALETTE_WIDTH}
      borderStyle="round"
      borderColor={t().fg.accent}
      backgroundColor={t().bg.panelAlt}
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text color={t().fg.accent} bold>
          Actions
        </Text>
        <Text color={t().fg.dim}>↑↓ · enter · esc</Text>
      </Box>
      <Text color={t().fg.dim}>{"─".repeat(PALETTE_WIDTH - 4)}</Text>
      {actions.map((action, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Box key={action.id} justifyContent="space-between">
            <Text>
              <Text color={isSelected ? t().fg.accent : t().fg.dim}>
                {isSelected ? "❯ " : "  "}
              </Text>
              <Text
                color={isSelected ? t().fg.primary : t().fg.secondary}
                bold={isSelected}
              >
                {action.label}
              </Text>
            </Text>
            {action.shortcut ? (
              <Text color={t().fg.dim}>{action.shortcut}</Text>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
