import { Box, Text } from "ink";
import type { Action } from "../../types";
import { t } from "../theme";

interface CommandPaletteProps {
  actions: Action[];
  selectedIndex: number;
}

export function CommandPalette({
  actions,
  selectedIndex,
}: CommandPaletteProps) {
  return (
    <Box
      flexDirection="column"
      position="absolute"
      left="50%"
      top="50%"
      borderStyle="round"
      borderColor={t().fg.accent}
      backgroundColor={t().bg.panelAlt}
    >
      <Text color={t().fg.accent} bold>
        {" "}
        Actions{" "}
      </Text>
      <Text color={t().fg.dim}>────────────</Text>
      {actions.map((action, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Text key={action.id}>
            <Text color={isSelected ? t().fg.accent : t().fg.dim}>
              {isSelected ? "❯ " : "  "}
            </Text>
            <Text color={isSelected ? t().fg.primary : t().fg.secondary}>
              {action.label}
            </Text>
            {action.shortcut && (
              <Text color={t().fg.dim}> {action.shortcut}</Text>
            )}
          </Text>
        );
      })}
    </Box>
  );
}
