import { describe, expect, test } from "bun:test";
import {
  codeBlockFlags,
  computeVisible,
  displayText,
  extractSelection,
  inlineSpans,
  layoutRows,
  orderSelection,
  parseInline,
  type Selection,
  selectionRangeForLine,
  wrapSpans,
} from "../tui/components/result-view";
import { parseMouseEvent } from "../tui/mouse";

describe("displayText", () => {
  test("strips markdown markers", () => {
    expect(displayText("# Title")).toBe("Title");
    expect(displayText("## Sub")).toBe("Sub");
    expect(displayText("### Sub")).toBe("Sub");
    expect(displayText("**bold**")).toBe("bold");
    expect(displayText("plain text")).toBe("plain text");
  });

  test("renders bullets with the buoy symbol", () => {
    expect(displayText("- item")).toBe("  ◦ item");
  });

  test("strips inline emphasis markers", () => {
    expect(displayText("say **hi** to *you* and `me`")).toBe(
      "say hi to you and me",
    );
    expect(displayText("- **done** now")).toBe("  ◦ done now");
  });

  test("leaves code lines verbatim", () => {
    expect(displayText("const a_b = *ptr;", true)).toBe("const a_b = *ptr;");
    expect(displayText("# not a heading in code", true)).toBe(
      "# not a heading in code",
    );
  });
});

describe("parseInline", () => {
  test("splits bold, italic and code spans", () => {
    expect(parseInline("a **b** c")).toEqual([
      { text: "a " },
      { text: "b", bold: true },
      { text: " c" },
    ]);
    expect(parseInline("a *b* c")).toEqual([
      { text: "a " },
      { text: "b", italic: true },
      { text: " c" },
    ]);
    expect(parseInline("a `b` c")).toEqual([
      { text: "a " },
      { text: "b", code: true },
      { text: " c" },
    ]);
  });

  test("leaves snake_case and spaced asterisks alone", () => {
    expect(parseInline("my_var_name")).toEqual([{ text: "my_var_name" }]);
    expect(parseInline("2 * 3 * 4")).toEqual([{ text: "2 * 3 * 4" }]);
  });

  test("keeps unmatched markers literal", () => {
    expect(parseInline("just ** stuff")).toEqual([{ text: "just ** stuff" }]);
  });

  test("emphasis spans concatenate back to the display text", () => {
    const line = "mix **bold** and *italic* and `code`";
    const joined = parseInline(line)
      .map((s) => s.text)
      .join("");
    expect(joined).toBe(displayText(line));
  });
});

describe("codeBlockFlags", () => {
  test("marks fenced lines and their contents as code", () => {
    const lines = ["intro", "```ts", "const a = 1;", "```", "outro"];
    expect(codeBlockFlags(lines)).toEqual([false, true, true, true, false]);
  });

  test("inlineSpans passes code lines through untouched", () => {
    expect(inlineSpans("a_b *c*", true)).toEqual([{ text: "a_b *c*" }]);
  });
});

describe("computeVisible", () => {
  test("follows the tail when scrollOffset is 0", () => {
    const content = Array.from({ length: 20 }, (_, i) => `line ${i}`).join(
      "\n",
    );
    const view = computeVisible(content, 0, 7); // maxLines = 5
    expect(view.maxLines).toBe(5);
    expect(view.start).toBe(15);
    expect(view.end).toBe(20);
  });

  test("scrolls up from the tail", () => {
    const content = Array.from({ length: 20 }, (_, i) => `line ${i}`).join(
      "\n",
    );
    const view = computeVisible(content, 3, 7);
    expect(view.start).toBe(12);
  });
});

describe("selectionRangeForLine", () => {
  const sel: Selection = {
    anchor: { line: 2, col: 3 },
    head: { line: 4, col: 5 },
  };

  test("null outside the selection", () => {
    expect(selectionRangeForLine(sel, 1, 10)).toBeNull();
    expect(selectionRangeForLine(sel, 5, 10)).toBeNull();
    expect(selectionRangeForLine(null, 3, 10)).toBeNull();
  });

  test("first line runs from anchor col to end", () => {
    expect(selectionRangeForLine(sel, 2, 10)).toEqual([3, 10]);
  });

  test("middle line covers the whole line", () => {
    expect(selectionRangeForLine(sel, 3, 10)).toEqual([0, 10]);
  });

  test("last line runs from start to head col", () => {
    expect(selectionRangeForLine(sel, 4, 10)).toEqual([0, 5]);
  });
});

describe("orderSelection", () => {
  test("normalizes a backwards selection", () => {
    const [from, to] = orderSelection({ line: 4, col: 1 }, { line: 2, col: 9 });
    expect(from).toEqual({ line: 2, col: 9 });
    expect(to).toEqual({ line: 4, col: 1 });
  });
});

describe("extractSelection", () => {
  const content = "first line\nsecond line\nthird line";

  test("single line, partial", () => {
    const sel: Selection = {
      anchor: { line: 0, col: 0 },
      head: { line: 0, col: 5 },
    };
    expect(extractSelection(content, sel)).toBe("first");
  });

  test("multi-line spans first tail, middles, last head", () => {
    const sel: Selection = {
      anchor: { line: 0, col: 6 },
      head: { line: 2, col: 5 },
    };
    expect(extractSelection(content, sel)).toBe("line\nsecond line\nthird");
  });

  test("works with a reversed drag", () => {
    const sel: Selection = {
      anchor: { line: 0, col: 5 },
      head: { line: 0, col: 0 },
    };
    expect(extractSelection(content, sel)).toBe("first");
  });

  test("empty on a collapsed selection (plain click)", () => {
    const sel: Selection = {
      anchor: { line: 1, col: 3 },
      head: { line: 1, col: 3 },
    };
    expect(extractSelection(content, sel)).toBe("");
  });

  test("copies displayed text, not raw markdown", () => {
    const md = "# Heading\nbody";
    const sel: Selection = {
      anchor: { line: 0, col: 0 },
      head: { line: 0, col: 7 },
    };
    expect(extractSelection(md, sel)).toBe("Heading");
  });
});

describe("wrapSpans", () => {
  test("keeps a short line as a single row", () => {
    expect(wrapSpans([{ text: "hello world" }], 40)).toEqual([
      { colStart: 0, spans: [{ text: "hello world" }] },
    ]);
  });

  test("wraps at word boundaries within the width", () => {
    const rows = wrapSpans([{ text: "aaaa bbbb cccc dddd" }], 10);
    expect(rows.map((r) => r.spans.map((s) => s.text).join(""))).toEqual([
      "aaaa bbbb ",
      "cccc dddd",
    ]);
    expect(rows.map((r) => r.colStart)).toEqual([0, 10]);
  });

  test("hard-splits a word longer than the width", () => {
    const rows = wrapSpans([{ text: "abcdefghijteed" }], 5);
    expect(rows.map((r) => r.spans.map((s) => s.text).join(""))).toEqual([
      "abcde",
      "fghij",
      "teed",
    ]);
  });

  test("preserves span styles across a wrap", () => {
    const rows = wrapSpans(
      [{ text: "plain " }, { text: "boldword", bold: true }],
      6,
    );
    // every character survives and the bold flag rides along
    expect(rows.flatMap((r) => r.spans).some((s) => s.bold)).toBe(true);
    expect(rows.map((r) => r.spans.map((s) => s.text).join("")).join("")).toBe(
      "plain boldword",
    );
  });

  test("rows reconstruct the display text with contiguous colStarts", () => {
    const line = "the quick brown fox jumps over the lazy dog";
    const rows = wrapSpans([{ text: line }], 12);
    // Concatenated rows equal the original text (nothing dropped)
    expect(rows.map((r) => r.spans.map((s) => s.text).join("")).join("")).toBe(
      line,
    );
    // colStart[n+1] == colStart[n] + row length
    for (let i = 1; i < rows.length; i++) {
      const prevLen = (rows[i - 1]?.spans ?? []).reduce(
        (n, s) => n + s.text.length,
        0,
      );
      expect(rows[i]?.colStart).toBe((rows[i - 1]?.colStart ?? 0) + prevLen);
    }
  });
});

describe("layoutRows", () => {
  test("splits code fences and wraps prose to width", () => {
    const content = ["a short line", "```", "code_line", "```"].join("\n");
    const rows = layoutRows(content, 80);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.line)).toEqual([0, 1, 2, 3]);
    expect(rows[2]?.isCode).toBe(true);
  });

  test("one logical line wraps into several rows tagged with its index", () => {
    const rows = layoutRows("aaaa bbbb cccc dddd eeee", 10);
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.every((r) => r.line === 0)).toBe(true);
  });
});

describe("parseMouseEvent", () => {
  test("left button press", () => {
    expect(parseMouseEvent("[<0;10;5M")).toEqual({
      col: 10,
      row: 5,
      release: false,
      motion: false,
      wheel: false,
      wheelDelta: 1,
    });
  });

  test("drag (motion with button held)", () => {
    const e = parseMouseEvent("[<32;12;6M");
    expect(e?.motion).toBe(true);
    expect(e?.release).toBe(false);
  });

  test("release", () => {
    const e = parseMouseEvent("[<0;12;6m");
    expect(e?.release).toBe(true);
  });

  test("wheel up and down", () => {
    expect(parseMouseEvent("[<64;1;1M")?.wheelDelta).toBe(1);
    expect(parseMouseEvent("[<65;1;1M")?.wheelDelta).toBe(-1);
    expect(parseMouseEvent("[<64;1;1M")?.wheel).toBe(true);
  });

  test("rejects non-mouse input", () => {
    expect(parseMouseEvent("hello")).toBeNull();
    expect(parseMouseEvent("[<0;10M")).toBeNull();
  });
});
