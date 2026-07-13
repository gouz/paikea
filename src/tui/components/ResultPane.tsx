import { Box, Text } from "ink";
import { colors, symbols } from "../theme";

interface ResultPaneProps {
  content: string;
  scrollOffset: number;
}

export function ResultPane({ content, scrollOffset }: ResultPaneProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.fg.accent}
    >
      <Text color={colors.fg.accent} bold>
        ── response ──
      </Text>
      {content ? (
        <ResultContent content={content} scrollOffset={scrollOffset} />
      ) : (
        <Text color={colors.fg.dim}>
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
}: {
  content: string;
  scrollOffset: number;
}) {
  const lines = content.split("\n");
  const visibleLines = lines.slice(scrollOffset, scrollOffset + 50);

  return (
    <Box flexDirection="column">
      {visibleLines.map((line) => {
        let displayLine = line;
        let color = colors.fg.primary;
        let bold = false;

        if (line.startsWith("# ")) {
          displayLine = line.slice(2);
          color = colors.fg.accent;
          bold = true;
        } else if (line.startsWith("## ")) {
          displayLine = line.slice(3);
          color = colors.fg.accent;
        } else if (line.startsWith("### ")) {
          displayLine = line.slice(4);
          color = colors.fg.warning;
        } else if (line.startsWith("**") && line.endsWith("**")) {
          displayLine = line.slice(2, -2);
          bold = true;
        } else if (line.startsWith("```")) {
          color = colors.fg.dim;
        } else if (line.startsWith("- ")) {
          displayLine = `  ${symbols.dot} ${line.slice(2)}`;
          color = colors.fg.secondary;
        } else if (/^\d+\.\s/.test(line)) {
          color = colors.fg.secondary;
        }

        return (
          <Text key={line.slice(0, 30)} color={color} bold={bold}>
            {displayLine}
          </Text>
        );
      })}
    </Box>
  );
}
