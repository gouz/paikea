import { Box, type DOMElement, Text } from "ink";
import type { ReactNode, Ref } from "react";
import { useSpinner } from "../hooks/use-spinner";
import { t } from "../theme";
import {
  computeVisibleRows,
  displayText,
  type InlineSpan,
  layoutRows,
  type PhysicalRow,
  type Selection,
  selectionRangeForLine,
} from "./result-view";

interface ResultPaneProps {
  content: string;
  scrollOffset: number;
  maxHeight: number;
  width: number;
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
  width,
  streaming,
  hasHistory,
  focused,
  selection,
  contentRef,
}: ResultPaneProps) {
  const height = Math.max(3, maxHeight);
  const spinner = useSpinner(streaming && !content);

  const { rows, start, maxLines, total } = computeVisibleRows(
    layoutRows(content, width),
    scrollOffset,
    maxHeight,
  );
  const overflow = total > maxLines;

  const title = overflow
    ? `── response · ${start + 1}–${Math.min(start + maxLines, total)}/${total} ──`
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
          rows={rows}
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

// Block-level styling for a raw response line (heading, bullet, code). Inline
// emphasis is layered on top per-span by renderSpans; this is the base every
// span inherits.
function lineStyle(
  line: string,
  isCode: boolean,
): { color: string; bold: boolean } {
  if (isCode) return { color: t().fg.dim, bold: false };
  if (line.startsWith("# ")) return { color: t().fg.accent, bold: true };
  if (line.startsWith("## ")) return { color: t().fg.accent, bold: false };
  if (line.startsWith("### ")) return { color: t().fg.warning, bold: false };
  if (line.startsWith("**") && line.endsWith("**"))
    return { color: t().fg.primary, bold: true };
  if (line.startsWith("- ")) return { color: t().fg.secondary, bold: false };
  if (/^\d+\.\s/.test(line)) return { color: t().fg.secondary, bold: false };
  return { color: t().fg.primary, bold: false };
}

function ResultContent({
  rows,
  selection,
  contentRef,
}: {
  rows: PhysicalRow[];
  selection: Selection | null;
  contentRef: Ref<DOMElement>;
}) {
  return (
    <Box flexDirection="column" ref={contentRef}>
      {rows.map((row, idx) => {
        const base = lineStyle(row.raw, row.isCode);
        const displayLength = displayText(row.raw, row.isCode).length;
        // Selection is tracked in logical (line, col) space; shift the line's
        // range into this wrapped row's local columns.
        const lineRange = selectionRangeForLine(
          selection,
          row.line,
          displayLength,
        );
        const range: [number, number] | null = lineRange
          ? [lineRange[0] - row.colStart, lineRange[1] - row.colStart]
          : null;

        return (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: flat row list, never reorders
            key={idx}
            wrap="truncate-end"
          >
            {renderSpans(row.spans, base, range)}
          </Text>
        );
      })}
    </Box>
  );
}

// Render a line's inline spans, layering each span's emphasis over the line's
// base style and painting the selected columns with an inverted swatch so the
// copied region is visible. Column ranges are in displayed-text space, matching
// the spans' concatenated text.
function renderSpans(
  spans: InlineSpan[],
  base: { color: string; bold: boolean },
  range: [number, number] | null,
) {
  const total = spans.reduce((n, s) => n + s.text.length, 0);

  // A blank line must still occupy one terminal row, otherwise it collapses to
  // zero height and the 1-row-per-physical-line invariant (that scrolling and
  // mouse mapping rely on) breaks. Render a single space — swatched when the
  // empty line falls inside the selection so the user can see it is included.
  if (total === 0) {
    return range ? (
      <Text backgroundColor={t().fg.accent} color={t().bg.panel}>
        {" "}
      </Text>
    ) : (
      <Text> </Text>
    );
  }

  const out: ReactNode[] = [];
  let col = 0;
  let key = 0;

  for (const span of spans) {
    const color = span.code ? t().fg.warning : base.color;
    const bold = base.bold || !!span.bold;
    const italic = !!span.italic;

    const emit = (text: string, selected: boolean) => {
      if (!text) return;
      out.push(
        <Text
          key={key++}
          color={selected ? t().bg.panel : color}
          backgroundColor={selected ? t().fg.accent : undefined}
          bold={bold}
          italic={italic}
        >
          {text}
        </Text>,
      );
    };

    if (!range) {
      emit(span.text, false);
    } else {
      const [from, to] = range;
      const len = span.text.length;
      const lo = Math.max(0, Math.min(len, from - col));
      const hi = Math.max(0, Math.min(len, to - col));
      emit(span.text.slice(0, lo), false);
      emit(span.text.slice(lo, hi), true);
      emit(span.text.slice(hi), false);
    }
    col += span.text.length;
  }

  return out;
}
