import { Box, type DOMElement, Text } from "ink";
import type { Ref } from "react";
import { useSpinner } from "../hooks/use-spinner";
import { t } from "../theme";
import {
  computeVisible,
  displayText,
  type Selection,
  selectionRangeForLine,
} from "./result-view";

interface ResultPaneProps {
  content: string;
  scrollOffset: number;
  maxHeight: number;
  streaming: boolean;
  hasHistory: boolean;
  focused: boolean;
  selection: Selection | null;
  contentRef: Ref<DOMElement>;
}

export function ResultPane({
  content,
  scrollOffset,
  maxHeight,
  streaming,
  hasHistory,
  focused,
  selection,
  contentRef,
}: ResultPaneProps) {
  const height = Math.max(3, maxHeight);
  const spinner = useSpinner(streaming && !content);

  const { lines, start, end, maxLines } = computeVisible(
    content,
    scrollOffset,
    maxHeight,
  );
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
        {overflow && scrollOffset > 0 && (
          <Text color={t().fg.dim}> ▼ shift+↓ latest</Text>
        )}
      </Box>
      {content ? (
        <ResultContent
          lines={lines.slice(start, end)}
          startLine={start}
          selection={selection}
          contentRef={contentRef}
        />
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
      {"  "}drag{"       "}select text in response → copied to clipboard
    </Text>,
  ];
  return <Box flexDirection="column">{lines.slice(0, maxLines)}</Box>;
}

// Styling role for a raw response line, mirroring the lightweight markdown in
// displayText(). Kept alongside the text transform so the two never drift.
function lineStyle(line: string): { color: string; bold: boolean } {
  if (line.startsWith("# ")) return { color: t().fg.accent, bold: true };
  if (line.startsWith("## ")) return { color: t().fg.accent, bold: false };
  if (line.startsWith("### ")) return { color: t().fg.warning, bold: false };
  if (line.startsWith("**") && line.endsWith("**"))
    return { color: t().fg.primary, bold: true };
  if (line.startsWith("```")) return { color: t().fg.dim, bold: false };
  if (line.startsWith("- ")) return { color: t().fg.secondary, bold: false };
  if (/^\d+\.\s/.test(line)) return { color: t().fg.secondary, bold: false };
  return { color: t().fg.primary, bold: false };
}

function ResultContent({
  lines,
  startLine,
  selection,
  contentRef,
}: {
  lines: string[];
  startLine: number;
  selection: Selection | null;
  contentRef: Ref<DOMElement>;
}) {
  return (
    <Box flexDirection="column" ref={contentRef}>
      {lines.map((line, idx) => {
        const displayLine = displayText(line);
        const { color, bold } = lineStyle(line);
        const globalLine = startLine + idx;
        const range = selectionRangeForLine(
          selection,
          globalLine,
          displayLine.length,
        );

        return (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: flat text list, never reorders
            key={`${startLine}-${idx}`}
            color={color}
            bold={bold}
            wrap="truncate-end"
          >
            {range
              ? renderHighlighted(displayLine, range, color, bold)
              : displayLine}
          </Text>
        );
      })}
    </Box>
  );
}

// Split a line into before / selected / after spans, styling the selected span
// with an inverted swatch so the copied region is visible.
function renderHighlighted(
  text: string,
  [from, to]: [number, number],
  color: string,
  bold: boolean,
) {
  // A fully-selected blank line has nothing to paint; show a single swatch so
  // the user can tell the empty line is part of the selection.
  if (text.length === 0) {
    return (
      <Text backgroundColor={t().fg.accent} color={t().bg.panel}>
        {" "}
      </Text>
    );
  }
  const before = text.slice(0, from);
  const selected = text.slice(from, to);
  const after = text.slice(to);
  return (
    <>
      {before && (
        <Text color={color} bold={bold}>
          {before}
        </Text>
      )}
      {selected && (
        <Text backgroundColor={t().fg.accent} color={t().bg.panel} bold={bold}>
          {selected}
        </Text>
      )}
      {after && (
        <Text color={color} bold={bold}>
          {after}
        </Text>
      )}
    </>
  );
}
