import { describe, expect, it } from "bun:test";
import { decodeInput, type KeyEvent } from "../renderer/input-decoder";

function bytes(...vals: (number | string)[]): Uint8Array {
  const out: number[] = [];
  for (const v of vals) {
    if (typeof v === "number") out.push(v);
    else for (const ch of v) out.push(ch.charCodeAt(0));
  }
  return new Uint8Array(out);
}

function codes(events: KeyEvent[]) {
  return events.map((e) => e.code);
}

describe("decodeInput", () => {
  it("decodes printable ASCII characters", () => {
    const { events, consumed } = decodeInput(bytes("hi"));
    expect(consumed).toBe(2);
    expect(codes(events)).toEqual([{ char: "h" }, { char: "i" }]);
  });

  it("decodes Enter, Tab and Backspace", () => {
    const { events } = decodeInput(bytes(0x0d, 0x09, 0x7f));
    expect(codes(events)).toEqual(["Enter", "Tab", "Backspace"]);
  });

  it("decodes a lone Escape only once more bytes arrive (keeps it pending)", () => {
    const { events, consumed } = decodeInput(bytes(0x1b));
    expect(events).toHaveLength(0);
    expect(consumed).toBe(0); // left pending for the timeout flush
  });

  it("decodes arrow keys (CSI)", () => {
    const { events } = decodeInput(bytes(0x1b, "[", "A", 0x1b, "[", "D"));
    expect(codes(events)).toEqual(["Up", "Left"]);
  });

  it("decodes modified arrow keys", () => {
    const { events } = decodeInput(bytes(0x1b, "[", "1;5", "C")); // Ctrl+Right
    expect(events[0]?.code).toBe("Right");
    expect(events[0]?.modifiers.ctrl).toBe(true);
  });

  it("decodes Shift+Tab as Tab+shift", () => {
    const { events } = decodeInput(bytes(0x1b, "[", "Z"));
    expect(events[0]?.code).toBe("Tab");
    expect(events[0]?.modifiers.shift).toBe(true);
  });

  it("decodes Delete / PageUp / PageDown (CSI ~)", () => {
    const { events } = decodeInput(
      bytes(0x1b, "[", "3~", 0x1b, "[", "5~", 0x1b, "[", "6~"),
    );
    expect(codes(events)).toEqual(["Delete", "PageUp", "PageDown"]);
  });

  it("decodes SS3 function-key style arrows", () => {
    const { events } = decodeInput(bytes(0x1b, "O", "A"));
    expect(events[0]?.code).toBe("Up");
  });

  it("decodes Ctrl+C and Ctrl+D", () => {
    const { events } = decodeInput(bytes(0x03, 0x04));
    expect(events[0]?.code).toEqual({ char: "c" });
    expect(events[0]?.modifiers.ctrl).toBe(true);
    expect(events[1]?.code).toEqual({ char: "d" });
    expect(events[1]?.modifiers.ctrl).toBe(true);
  });

  it("swallows mouse reports without emitting keys", () => {
    const { events } = decodeInput(bytes(0x1b, "[", "<0;10;10", "M"));
    expect(events).toHaveLength(0);
  });

  it("keeps an incomplete CSI sequence pending", () => {
    const { events, consumed } = decodeInput(bytes("a", 0x1b, "["));
    expect(codes(events)).toEqual([{ char: "a" }]);
    expect(consumed).toBe(1); // ESC[ left for the next chunk
  });

  it("decodes UTF-8 multibyte characters", () => {
    const { events } = decodeInput(new TextEncoder().encode("é"));
    expect(events[0]?.code).toEqual({ char: "é" });
  });

  it("keeps an incomplete UTF-8 sequence pending", () => {
    const full = new TextEncoder().encode("é"); // 2 bytes
    const { events, consumed } = decodeInput(full.slice(0, 1));
    expect(events).toHaveLength(0);
    expect(consumed).toBe(0);
  });
});
