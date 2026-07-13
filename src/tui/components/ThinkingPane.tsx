import { Box, Text } from "ink";
import { colors, symbols } from "../theme";

interface ThinkingPaneProps {
  content: string;
  visible: boolean;
}

export function ThinkingPane({ content, visible }: ThinkingPaneProps) {
  if (!visible) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.fg.thinking}
    >
      <Text color={colors.fg.thinking} bold>
        ── thinking ──
      </Text>
      {content ? (
        <Text color={colors.fg.thinking}>{content}</Text>
      ) : (
        <Text color={colors.fg.thinking}>
          {
            symbols.spinner[
              Math.floor(Date.now() / 100) % symbols.spinner.length
            ]
          }{" "}
          thinking...
        </Text>
      )}
    </Box>
  );
}
