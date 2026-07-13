// A decoded SGR mouse report. After Ink strips the leading ESC, a report looks
// like "[<button;col;row" followed by "M" (press/motion) or "m" (release).
// Columns and rows are 1-based.
export interface MouseEvent {
  col: number;
  row: number;
  release: boolean;
  motion: boolean;
  wheel: boolean;
  // For wheel events: +1 = up (toward older content), -1 = down (toward tail).
  wheelDelta: number;
}

const SGR_MOUSE = /^\[<(\d+);(\d+);(\d+)([Mm])$/;

export function parseMouseEvent(input: string): MouseEvent | null {
  const match = SGR_MOUSE.exec(input);
  if (!match) return null;
  const button = Number(match[1]);
  return {
    col: Number(match[2]),
    row: Number(match[3]),
    release: match[4] === "m",
    // Bit 5 (32): motion while a button is held. Bit 6 (64): wheel.
    motion: (button & 32) !== 0,
    wheel: (button & 64) !== 0,
    wheelDelta: (button & 1) === 0 ? 1 : -1,
  };
}
