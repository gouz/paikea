/**
 * Self-contained ANSI/VT input decoder.
 *
 * The bundled `@hexie/tui` decoder only emits usable events when the Kitty
 * keyboard protocol is negotiated with the terminal. Terminals that don't
 * speak Kitty (macOS Terminal.app, most legacy emulators) send classic VT
 * sequences, which that decoder silently drops. This decoder handles the
 * classic sequences directly so the TUI works everywhere.
 *
 * It is intentionally pure: `decodeInput` turns a byte buffer into events plus
 * a count of consumed bytes, leaving any incomplete trailing sequence for the
 * next chunk. The escape-disambiguation timing lives in the caller (terminal.ts).
 */

export type KeyCode = string | { char: string };

export interface KeyModifiers {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export interface KeyEvent {
  type: "key";
  code: KeyCode;
  modifiers: KeyModifiers;
}

export interface DecodeResult {
  events: KeyEvent[];
  /** Number of leading bytes consumed; the rest is an incomplete tail. */
  consumed: number;
}

const ESC = 0x1b;

function mods(p: Partial<KeyModifiers> = {}): KeyModifiers {
  return {
    ctrl: p.ctrl ?? false,
    alt: p.alt ?? false,
    shift: p.shift ?? false,
    meta: p.meta ?? false,
  };
}

function key(code: KeyCode, m: Partial<KeyModifiers> = {}): KeyEvent {
  return { type: "key", code, modifiers: mods(m) };
}

/** xterm modifier param (e.g. the `5` in `ESC[1;5A`) → modifier flags. */
function decodeModifierParam(param: number | undefined): Partial<KeyModifiers> {
  if (!param || param <= 1) return {};
  const bits = param - 1;
  return {
    shift: (bits & 1) !== 0,
    alt: (bits & 2) !== 0,
    ctrl: (bits & 4) !== 0,
    meta: (bits & 8) !== 0,
  };
}

const CSI_LETTER: Record<string, string> = {
  A: "Up",
  B: "Down",
  C: "Right",
  D: "Left",
  H: "Home",
  F: "End",
};

const CSI_TILDE: Record<number, string> = {
  1: "Home",
  2: "Insert",
  3: "Delete",
  4: "End",
  5: "PageUp",
  6: "PageDown",
  7: "Home",
  8: "End",
};

function isCsiFinal(byte: number): boolean {
  return byte >= 0x40 && byte <= 0x7e;
}

/** Parse a CSI body (params between `ESC[` and the final byte). */
function parseCsi(params: string, finalByte: number): KeyEvent | null {
  const final = String.fromCharCode(finalByte);

  // Mouse reports (we never enable mouse tracking) — swallow silently.
  if (params.startsWith("<") || final === "M" || final === "m") return null;

  const parts = params.split(";").map((p) => Number.parseInt(p, 10));
  const modifiers = decodeModifierParam(parts[1]);

  if (final === "Z") return key("Tab", { shift: true }); // Shift+Tab (BackTab)

  if (final === "~") {
    const name = CSI_TILDE[parts[0] ?? 0];
    return name ? key(name, modifiers) : null;
  }

  const name = CSI_LETTER[final];
  return name ? key(name, modifiers) : null;
}

const SS3_MAP: Record<string, string> = {
  A: "Up",
  B: "Down",
  C: "Right",
  D: "Left",
  H: "Home",
  F: "End",
  P: "F1",
  Q: "F2",
  R: "F3",
  S: "F4",
};

/**
 * Decode as many complete key events as possible from `buf`.
 *
 * A lone trailing `ESC` (or an incomplete escape sequence) is left unconsumed
 * so the caller can disambiguate it against a timeout.
 */
export function decodeInput(buf: Uint8Array): DecodeResult {
  const events: KeyEvent[] = [];
  const len = buf.length;
  let i = 0;

  while (i < len) {
    const b = buf[i] as number;

    if (b === ESC) {
      if (i + 1 >= len) break; // lone/incomplete ESC → wait for more bytes
      const b1 = buf[i + 1] as number;

      if (b1 === 0x5b) {
        // CSI: ESC [ params final
        let j = i + 2;
        while (j < len && !isCsiFinal(buf[j] as number)) j++;
        if (j >= len) break; // incomplete CSI → wait
        const params = String.fromCharCode(...buf.slice(i + 2, j));
        const ev = parseCsi(params, buf[j] as number);
        if (ev) events.push(ev);
        i = j + 1;
        continue;
      }

      if (b1 === 0x4f) {
        // SS3: ESC O <letter> (application cursor / function keys)
        if (i + 2 >= len) break;
        const name = SS3_MAP[String.fromCharCode(buf[i + 2] as number)];
        if (name) events.push(key(name));
        i += 3;
        continue;
      }

      if (b1 === ESC) {
        // ESC ESC → a standalone Escape followed by more input
        events.push(key("Escape"));
        i += 1;
        continue;
      }

      if (b1 >= 0x20 && b1 < 0x7f) {
        // Alt/Meta + printable char (ESC prefix)
        events.push(key({ char: String.fromCharCode(b1) }, { alt: true }));
        i += 2;
        continue;
      }

      // ESC + control byte we don't model → treat the ESC as Escape.
      events.push(key("Escape"));
      i += 1;
      continue;
    }

    if (b === 0x0d || b === 0x0a) {
      events.push(key("Enter"));
      i += 1;
      continue;
    }
    if (b === 0x09) {
      events.push(key("Tab"));
      i += 1;
      continue;
    }
    if (b === 0x7f || b === 0x08) {
      events.push(key("Backspace"));
      i += 1;
      continue;
    }
    // Common Ctrl+<letter> shortcuts (raw mode delivers these as low bytes).
    if (b === 0x03) {
      events.push(key({ char: "c" }, { ctrl: true }));
      i += 1;
      continue;
    }
    if (b === 0x04) {
      events.push(key({ char: "d" }, { ctrl: true }));
      i += 1;
      continue;
    }
    if (b === 0x01) {
      events.push(key({ char: "a" }, { ctrl: true }));
      i += 1;
      continue;
    }
    if (b === 0x05) {
      events.push(key({ char: "e" }, { ctrl: true }));
      i += 1;
      continue;
    }
    if (b === 0x15) {
      events.push(key({ char: "u" }, { ctrl: true })); // Ctrl+U (kill line)
      i += 1;
      continue;
    }
    if (b === 0x17) {
      events.push(key({ char: "w" }, { ctrl: true })); // Ctrl+W (kill word)
      i += 1;
      continue;
    }
    if (b < 0x20) {
      i += 1; // other control bytes: ignore
      continue;
    }
    if (b < 0x80) {
      events.push(key({ char: String.fromCharCode(b) }));
      i += 1;
      continue;
    }

    // UTF-8 multi-byte sequence.
    let n = 1;
    if (b >= 0xf0) n = 4;
    else if (b >= 0xe0) n = 3;
    else if (b >= 0xc0) n = 2;
    if (i + n > len) break; // incomplete UTF-8 → wait
    const char = new TextDecoder().decode(buf.slice(i, i + n));
    events.push(key({ char }));
    i += n;
  }

  return { events, consumed: i };
}
