import { Box, Text } from "ink";
import type { Action } from "../../types";
import { colors } from "../theme";

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
      borderColor={colors.fg.accent}
      backgroundColor={colors.bg.panelAlt}
    >
      <Text color={colors.fg.accent} bold>
        {" "}
        Actions{" "}
      </Text>
      <Text color={colors.fg.dim}>────────────</Text>
      {actions.map((action, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Text key={action.id}>
            <Text color={isSelected ? colors.fg.accent : colors.fg.dim}>
              {isSelected ? "❯ " : "  "}
            </Text>
            <Text color={isSelected ? colors.fg.primary : colors.fg.secondary}>
              {action.label}
            </Text>
            {action.shortcut && (
              <Text color={colors.fg.dim}> {action.shortcut}</Text>
            )}
          </Text>
        );
      })}
    </Box>
  );
}
