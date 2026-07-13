import { Box, Text } from "ink";
import { symbols, t } from "../theme";

interface ResultPaneProps {
  content: string;
  scrollOffset: number;
  maxHeight: number;
}

export function ResultPane({
  content,
  scrollOffset,
  maxHeight,
}: ResultPaneProps) {
  const height = Math.max(3, maxHeight);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={t().fg.accent}
      flexGrow={1}
      height={height}
    >
      <Text color={t().fg.accent} bold>
        ── response ──
      </Text>
      {content ? (
        <ResultContent
          content={content}
          scrollOffset={scrollOffset}
          maxLines={height - 2}
        />
      ) : (
        <Text color={t().fg.dim}>
          {
            symbols.spinner[
              Math.floor(Date.now() / 100) % symbols.spinner.length
            ]
          }{" "}
          awaiting response...
        </Text>
      )}
    </Box>
  );
}

function ResultContent({
  content,
  scrollOffset,
  maxLines,
}: {
  content: string;
  scrollOffset: number;
  maxLines: number;
}) {
  const lines = content.split("\n");
  const visibleLines = lines.slice(
    scrollOffset,
    scrollOffset + Math.max(1, maxLines),
  );

  return (
    <Box flexDirection="column">
      {visibleLines.map((line, idx) => {
        let displayLine = line;
        let color = t().fg.primary;
        let bold = false;

        if (line.startsWith("# ")) {
          displayLine = line.slice(2);
          color = t().fg.accent;
          bold = true;
        } else if (line.startsWith("## ")) {
          displayLine = line.slice(3);
          color = t().fg.accent;
        } else if (line.startsWith("### ")) {
          displayLine = line.slice(4);
          color = t().fg.warning;
        } else if (line.startsWith("**") && line.endsWith("**")) {
          displayLine = line.slice(2, -2);
          bold = true;
        } else if (line.startsWith("```")) {
          color = t().fg.dim;
        } else if (line.startsWith("- ")) {
          displayLine = `  ${symbols.dot} ${line.slice(2)}`;
          color = t().fg.secondary;
        } else if (/^\d+\.\s/.test(line)) {
          color = t().fg.secondary;
        }

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: flat text list, never reorders
          <Text key={`${scrollOffset}-${idx}`} color={color} bold={bold}>
            {displayLine}
          </Text>
        );
      })}
    </Box>
  );
}
