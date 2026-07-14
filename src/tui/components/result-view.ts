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

// One visual row after word-wrapping a logical line to the pane width.
// `colStart` is the display column (in the logical line) where the row begins,
// so selection ranges — kept in logical (line, col) space — map back onto it.
export interface WrappedRow {
  colStart: number;
  spans: InlineSpan[];
}

const sameStyle = (a: InlineSpan, b: InlineSpan): boolean =>
  !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.code === !!b.code;

// Word-wrap a logical line's spans into visual rows no wider than `width`,
// breaking at whitespace and hard-splitting words longer than the width. Every
// display character lands in exactly one row (nothing is dropped), so a row's
// `colStart` plus its length always equals the next row's `colStart` — keeping
// wrapped rows in lock-step with logical selection columns.
export function wrapSpans(spans: InlineSpan[], width: number): WrappedRow[] {
  const total = spans.reduce((n, s) => n + s.text.length, 0);
  if (width <= 0 || total <= width) {
    return [{ colStart: 0, spans: spans.length ? spans : [{ text: "" }] }];
  }

  const toks: { text: string; span: InlineSpan }[] = [];
  for (const s of spans) {
    for (const part of s.text.match(/\s+|\S+/g) ?? []) {
      toks.push({ text: part, span: s });
    }
  }

  const rows: WrappedRow[] = [];
  let cur: InlineSpan[] = [];
  let curLen = 0;
  let consumed = 0;
  let colStart = 0;

  const add = (text: string, span: InlineSpan) => {
    const last = cur[cur.length - 1];
    if (last && sameStyle(last, span)) last.text += text;
    else
      cur.push({
        text,
        bold: span.bold,
        italic: span.italic,
        code: span.code,
      });
    curLen += text.length;
    consumed += text.length;
  };
  const flush = () => {
    rows.push({ colStart, spans: cur.length ? cur : [{ text: "" }] });
    cur = [];
    curLen = 0;
    colStart = consumed;
  };

  for (const tok of toks) {
    let text = tok.text;
    while (text.length > width) {
      const room = width - curLen;
      if (room > 0) {
        add(text.slice(0, room), tok.span);
        text = text.slice(room);
      }
      flush();
    }
    if (curLen > 0 && curLen + text.length > width) flush();
    add(text, tok.span);
  }
  flush();
  return rows;
}

// A visual row of the whole response: which logical line it came from, where in
// that line it starts, and the styled spans to render.
export interface PhysicalRow {
  line: number;
  colStart: number;
  spans: InlineSpan[];
  isCode: boolean;
  raw: string;
}

// Lay the full response out into visual rows, word-wrapping every logical line
// to `width`. This is the single source of truth both the renderer and the
// mouse-mapping use, so wrapped text scrolls and selects consistently.
export function layoutRows(content: string, width: number): PhysicalRow[] {
  if (!content) return [];
  const lines = content.split("\n");
  const flags = codeBlockFlags(lines);
  const out: PhysicalRow[] = [];
  lines.forEach((raw, i) => {
    const isCode = flags[i] ?? false;
    const spans = inlineSpans(raw, isCode);
    for (const row of wrapSpans(spans, width)) {
      out.push({
        line: i,
        colStart: row.colStart,
        spans: row.spans,
        isCode,
        raw,
      });
    }
  });
  return out;
}

export interface RowView {
  rows: PhysicalRow[];
  start: number;
  maxLines: number;
  total: number;
}

// The visible slice of pre-laid-out rows, windowed exactly like computeVisible
// but counting wrapped visual rows so one row is always one terminal line.
export function computeVisibleRows(
  rows: PhysicalRow[],
  scrollOffset: number,
  maxHeight: number,
): RowView {
  const height = Math.max(3, maxHeight);
  const maxLines = height - 2;
  const clampedOffset = Math.min(
    scrollOffset,
    Math.max(0, rows.length - maxLines),
  );
  const start = Math.max(0, rows.length - maxLines - clampedOffset);
  return {
    rows: rows.slice(start, start + maxLines),
    start,
    maxLines,
    total: rows.length,
  };
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
