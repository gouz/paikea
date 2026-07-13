import { Box, Text } from "ink";
import type { Model } from "../../types";
import { symbols, t } from "../theme";

interface HeaderProps {
  model: Model | null;
}

export function Header({ model }: HeaderProps) {
  return (
    <Box>
      <Text bold color={t().fg.accent}>
        🏄 paikea
      </Text>
      <Text> </Text>
      <Text color={t().fg.primary}>
        {symbols.gear} {model?.name ?? "none"}
      </Text>
      <Text> </Text>
      <Text color={t().fg.dim}>
        enter send · tab model · ctrl+← → steps · ctrl+p palette · esc quit
      </Text>
    </Box>
  );
}
