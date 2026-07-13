import { describe, expect, test } from "bun:test";
import {
  computeVisible,
  displayText,
  extractSelection,
  orderSelection,
  type Selection,
  selectionRangeForLine,
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
