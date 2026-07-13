import { Box, Text } from "ink";
import type { Model } from "../../types";
import { colors, FRISE_CHARS, friseColor, symbols } from "../theme";

interface HeaderProps {
  model: Model | null;
}

export function Header({ model }: HeaderProps) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color={colors.fg.accent}>
          🏄 paikea
        </Text>
        <Text> </Text>
        <Text color={colors.fg.primary}>
          {symbols.gear} {model?.name ?? "none"}
        </Text>
        <Text> </Text>
        <Text color={colors.fg.dim}>
          enter send · tab model · ↑ tools · : palette · esc quit
        </Text>
      </Box>
      <Frise />
    </Box>
  );
}

function Frise() {
  const chars = FRISE_CHARS.map((char, idx) => {
    const color = friseColor(idx);
    return (
      <Text key={`${char}-${color}`} color={color}>
        {char}
      </Text>
    );
  });

  return <Box>{chars}</Box>;
}
