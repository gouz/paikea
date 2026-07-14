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

// A styled slice of a line. Concatenating every span's `text` reproduces the
// line's displayed text exactly, so selection columns stay marker-free and in
// lock-step with what is rendered.
export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

// Strip the block-level markdown marker a line opens with (heading, whole-line
// bold, bullet). The inline emphasis inside the remainder is handled by
// parseInline.
function stripBlock(line: string): string {
  if (line.startsWith("# ")) return line.slice(2);
  if (line.startsWith("## ")) return line.slice(3);
  if (line.startsWith("### ")) return line.slice(4);
  if (line.startsWith("**") && line.endsWith("**")) return line.slice(2, -2);
  if (line.startsWith("- ")) return `  ${symbols.dot} ${line.slice(2)}`;
  return line;
}

// A char that can sit next to an `_` emphasis marker without it being part of a
// word (so snake_case identifiers are left alone).
const isBoundary = (ch: string | undefined): boolean =>
  ch === undefined || /[\s([{<'"]/.test(ch);

// Parse inline markdown emphasis (`**bold**`, `*italic*`, `_italic_`,
// `` `code` ``) in a block-stripped line into styled spans. Unmatched markers
// are kept as literal text. Concatenating the spans' text yields the plain
// display string.
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let plain = "";
  const push = (span: InlineSpan) => {
    if (plain) {
      spans.push({ text: plain });
      plain = "";
    }
    if (span.text) spans.push(span);
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    // Inline code: `...` — highest precedence, no nested parsing.
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        push({ text: text.slice(i + 1, end), code: true });
        i = end + 1;
        continue;
      }
    }

    // Bold: **...**
    if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        push({ text: text.slice(i + 2, end), bold: true });
        i = end + 2;
        continue;
      }
    }

    // Italic: *...* (no space just inside the markers).
    if (ch === "*" && text[i + 1] !== "*" && text[i + 1] !== " ") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1 && text[end - 1] !== " ") {
        push({ text: text.slice(i + 1, end), italic: true });
        i = end + 1;
        continue;
      }
    }

    // Italic: _..._ only at word boundaries.
    if (ch === "_" && isBoundary(text[i - 1]) && text[i + 1] !== " ") {
      const end = text.indexOf("_", i + 1);
      if (end > i + 1 && text[end - 1] !== " " && isBoundary(text[end + 1])) {
        push({ text: text.slice(i + 1, end), italic: true });
        i = end + 1;
        continue;
      }
    }

    plain += ch;
    i++;
  }
  if (plain) spans.push({ text: plain });
  return spans;
}

// The styled spans a raw response line renders as. Code lines (inside a ```
// fence) are passed through verbatim so their contents are never mistaken for
// markdown.
export function inlineSpans(line: string, isCode = false): InlineSpan[] {
  if (isCode) return [{ text: line }];
  return parseInline(stripBlock(line));
}

// Which lines fall inside a fenced ``` code block. The fence lines themselves
// count as code so their backticks aren't treated as inline markers.
export function codeBlockFlags(lines: string[]): boolean[] {
  const flags: boolean[] = [];
  let inFence = false;
  for (const line of lines) {
    const isFence = line.trimStart().startsWith("```");
    flags.push(inFence || isFence);
    if (isFence) inFence = !inFence;
  }
  return flags;
}

// The text a raw response line renders as, after the markdown styling ResultPane
// applies. Selection columns and clipboard output are expressed against this
// displayed text so "what you highlight is what you copy".
export function displayText(line: string, isCode = false): string {
  return inlineSpans(line, isCode)
    .map((s) => s.text)
    .join("");
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
  const codeFlags = codeBlockFlags(lines);
  const dt = (i: number) => displayText(lines[i] ?? "", codeFlags[i] ?? false);
  const [from, to] = orderSelection(selection.anchor, selection.head);
  if (from.line === to.line) {
    return dt(from.line).slice(from.col, to.col);
  }
  const out: string[] = [dt(from.line).slice(from.col)];
  for (let i = from.line + 1; i < to.line; i++) out.push(dt(i));
  out.push(dt(to.line).slice(0, to.col));
  return out.join("\n");
}
