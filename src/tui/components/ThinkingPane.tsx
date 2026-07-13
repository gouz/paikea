import { Box, Text } from "ink";
import { useSpinner } from "../hooks/use-spinner";
import { t } from "../theme";

interface ThinkingPaneProps {
  content: string;
  active: boolean;
  visible: boolean;
  maxHeight: number;
  scrollOffset: number;
  focused: boolean;
}

export function ThinkingPane({
  content,
  active,
  visible,
  maxHeight,
  scrollOffset,
  focused,
}: ThinkingPaneProps) {
  const spinner = useSpinner(active && visible);

  if (!visible || maxHeight < 2) return null;
  if (!content && !active) return null;

  const maxLines = Math.max(1, maxHeight - 2);
  const lines = content ? content.split("\n") : [];
  // scrollOffset counts from the bottom: 0 = follow the latest thinking
  const clampedOffset = Math.min(
    scrollOffset,
    Math.max(0, lines.length - maxLines),
  );
  const start = Math.max(0, lines.length - maxLines - clampedOffset);
  const end = start + maxLines;
  const overflow = lines.length > maxLines;
  const visibleLines = lines.slice(start, end);

  const title = overflow
    ? `── thinking ${active ? spinner : "✓"} · ${start + 1}–${Math.min(end, lines.length)}/${lines.length} ──`
    : `── thinking ${active ? spinner : "✓"} ──`;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? t().fg.accent : t().fg.thinking}
      height={maxHeight}
    >
      <Box>
        <Text color={t().fg.thinking} bold>
          {title}
        </Text>
        {focused && overflow && <Text color={t().fg.dim}> ↑↓ scroll</Text>}
      </Box>
      {content ? (
        visibleLines.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: flat text list, never reorders
          <Text key={`t-${i}`} color={t().fg.thinking} wrap="truncate-end">
            {line}
          </Text>
        ))
      ) : (
        <Text color={t().fg.thinking}>{spinner} thinking...</Text>
      )}
    </Box>
  );
}
