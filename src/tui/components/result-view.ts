import { symbols } from "../theme";

// A selection anchor: a global line index into the full response plus a column
// into that line's displayed text.
export interface SelectionPos {
  line: number;
  col: number;
}

export interface Selection {
  anchor: SelectionPos;
  head: SelectionPos;
}

// The visible slice of the response, computed identically to how ResultPane
// renders it. Shared so mouse-coordinate mapping stays in lock-step with what
// is actually on screen.
export interface ResultView {
  lines: string[];
  start: number;
  end: number;
  maxLines: number;
}

export function computeVisible(
  content: string,
  scrollOffset: number,
  maxHeight: number,
): ResultView {
  const height = Math.max(3, maxHeight);
  const maxLines = height - 2;
  const lines = content ? content.split("\n") : [];
  // scrollOffset counts from the bottom: 0 = follow the tail
  const clampedOffset = Math.min(
    scrollOffset,
    Math.max(0, lines.length - maxLines),
  );
  const start = Math.max(0, lines.length - maxLines - clampedOffset);
  const end = start + maxLines;
  return { lines, start, end, maxLines };
}

// The text a raw response line renders as, after the lightweight markdown
// styling ResultPane applies. Selection columns and clipboard output are
// expressed against this displayed text so "what you highlight is what you
// copy".
export function displayText(line: string): string {
  if (line.startsWith("# ")) return line.slice(2);
  if (line.startsWith("## ")) return line.slice(3);
  if (line.startsWith("### ")) return line.slice(4);
  if (line.startsWith("**") && line.endsWith("**")) return line.slice(2, -2);
  if (line.startsWith("- ")) return `  ${symbols.dot} ${line.slice(2)}`;
  return line;
}

// Order two positions so the returned pair reads top-to-bottom, left-to-right.
export function orderSelection(
  a: SelectionPos,
  b: SelectionPos,
): [SelectionPos, SelectionPos] {
  if (a.line < b.line || (a.line === b.line && a.col <= b.col)) return [a, b];
  return [b, a];
}

// The highlighted column span [start, end) for a given global line, or null
// when the line falls outside the selection.
export function selectionRangeForLine(
  selection: Selection | null,
  line: number,
  length: number,
): [number, number] | null {
  if (!selection) return null;
  const [from, to] = orderSelection(selection.anchor, selection.head);
  if (line < from.line || line > to.line) return null;
  const start = line === from.line ? from.col : 0;
  const end = line === to.line ? to.col : length;
  return [Math.max(0, start), Math.min(length, end)];
}

// The displayed text covered by a selection, joined with newlines. Columns are
// in displayed-text space, so the result matches exactly what is highlighted.
export function extractSelection(
  content: string,
  selection: Selection,
): string {
  const lines = content.split("\n");
  const dt = (i: number) => displayText(lines[i] ?? "");
  const [from, to] = orderSelection(selection.anchor, selection.head);
  if (from.line === to.line) {
    return dt(from.line).slice(from.col, to.col);
  }
  const out: string[] = [dt(from.line).slice(from.col)];
  for (let i = from.line + 1; i < to.line; i++) out.push(dt(i));
  out.push(dt(to.line).slice(0, to.col));
  return out.join("\n");
}
