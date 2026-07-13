import { Box, Text } from "ink";
import { symbols, t } from "../theme";

interface ThinkingPaneProps {
  content: string;
  visible: boolean;
  maxHeight: number;
}

export function ThinkingPane({
  content,
  visible,
  maxHeight,
}: ThinkingPaneProps) {
  if (!visible || maxHeight < 2) return null;

  const lines = content.split("\n");
  const visibleLines = lines.slice(0, Math.max(1, maxHeight - 2));

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={t().fg.thinking}
      height={maxHeight}
    >
      <Text color={t().fg.thinking} bold>
        ── thinking ──
      </Text>
      {content ? (
        visibleLines.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: flat text list, never reorders
          <Text key={`t-${i}`} color={t().fg.thinking}>
            {line}
          </Text>
        ))
      ) : (
        <Text color={t().fg.thinking}>
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
