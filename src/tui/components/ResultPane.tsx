import { Box, Text } from "ink";
import { useSpinner } from "../hooks/use-spinner";
import { symbols, t } from "../theme";

interface ResultPaneProps {
  content: string;
  scrollOffset: number;
  maxHeight: number;
  streaming: boolean;
  hasHistory: boolean;
  focused: boolean;
}

export function ResultPane({
  content,
  scrollOffset,
  maxHeight,
  streaming,
  hasHistory,
  focused,
}: ResultPaneProps) {
  const height = Math.max(3, maxHeight);
  const spinner = useSpinner(streaming && !content);
  const maxLines = height - 2;

  const lines = content ? content.split("\n") : [];
  // scrollOffset counts from the bottom: 0 = follow the tail
  const clampedOffset = Math.min(
    scrollOffset,
    Math.max(0, lines.length - maxLines),
  );
  const start = Math.max(0, lines.length - maxLines - clampedOffset);
  const end = start + maxLines;
  const overflow = lines.length > maxLines;

  const title = overflow
    ? `── response · ${start + 1}–${Math.min(end, lines.length)}/${lines.length} ──`
    : "── response ──";

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? t().fg.accent : t().fg.dim}
      flexGrow={1}
      height={height}
    >
      <Box>
        <Text color={t().fg.accent} bold>
          {title}
        </Text>
        {overflow && clampedOffset > 0 && (
          <Text color={t().fg.dim}> ▼ shift+↓ latest</Text>
        )}
      </Box>
      {content ? (
        <ResultContent lines={lines.slice(start, end)} startLine={start} />
      ) : streaming ? (
        <Text color={t().fg.dim}>{spinner} awaiting response...</Text>
      ) : (
        <Welcome hasHistory={hasHistory} maxLines={maxLines} />
      )}
    </Box>
  );
}

function Welcome({
  hasHistory,
  maxLines,
}: {
  hasHistory: boolean;
  maxLines: number;
}) {
  if (hasHistory) {
    return <Text color={t().fg.dim}>calm seas — awaiting orders</Text>;
  }
  const lines = [
    <Text key="l1" color={t().fg.accent} bold>
      {"  "}🏄 paikea
    </Text>,
    <Text key="l2" color={t().fg.secondary}>
      {"  "}Chat with local LLMs via 🐳 Docker Model Runner
    </Text>,
    <Text key="l3"> </Text>,
    <Text key="l4" color={t().fg.dim}>
      {"  "}enter{"      "}send prompt
    </Text>,
    <Text key="l5" color={t().fg.dim}>
      {"  "}tab{"        "}accept suggestion / next model
    </Text>,
    <Text key="l6" color={t().fg.dim}>
      {"  "}ctrl+p{"     "}command palette (themes, models…)
    </Text>,
    <Text key="l7" color={t().fg.dim}>
      {"  "}↑/↓{"        "}scroll · ctrl+t switches thinking / response
    </Text>,
    <Text key="l8" color={t().fg.dim}>
      {"  "}/step{"      "}switch workflow step (/discuss, /proposal, /apply…)
    </Text>,
  ];
  return <Box flexDirection="column">{lines.slice(0, maxLines)}</Box>;
}

function ResultContent({
  lines,
  startLine,
}: {
  lines: string[];
  startLine: number;
}) {
  return (
    <Box flexDirection="column">
      {lines.map((line, idx) => {
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
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: flat text list, never reorders
            key={`${startLine}-${idx}`}
            color={color}
            bold={bold}
            wrap="truncate-end"
          >
            {displayLine}
          </Text>
        );
      })}
    </Box>
  );
}
