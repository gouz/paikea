import { Terminal } from "@hexie/tui";
import { decodeInput, type KeyEvent } from "./input-decoder";

/** How long to wait after a lone ESC before treating it as the Escape key. */
const ESC_FLUSH_MS = 40;

let term: Terminal | null = null;
let stream: InputStream | null = null;

/**
 * Async, closeable stream of decoded key events read straight from stdin.
 *
 * We decode classic VT sequences ourselves (see input-decoder.ts) rather than
 * relying on the library's Kitty-only decoder, and disambiguate a bare ESC from
 * the start of an escape sequence with a short flush timer.
 */
class InputStream implements AsyncIterable<KeyEvent> {
  private queue: KeyEvent[] = [];
  private resolvers: Array<(r: IteratorResult<KeyEvent>) => void> = [];
  private pending = new Uint8Array(0);
  private escTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor() {
    this.reader = Bun.stdin
      .stream()
      .getReader() as ReadableStreamDefaultReader<Uint8Array>;
    void this.readLoop();
  }

  private emit(event: KeyEvent) {
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value: event, done: false });
    } else {
      this.queue.push(event);
    }
  }

  private clearEscTimer() {
    if (this.escTimer) {
      clearTimeout(this.escTimer);
      this.escTimer = null;
    }
  }

  /** Schedule flushing a stalled ESC-prefixed tail as a standalone Escape. */
  private scheduleEscFlush() {
    this.clearEscTimer();
    this.escTimer = setTimeout(() => {
      this.escTimer = null;
      if (this.pending.length > 0 && this.pending[0] === 0x1b) {
        this.pending = new Uint8Array(0);
        this.emit({
          type: "key",
          code: "Escape",
          modifiers: { ctrl: false, alt: false, shift: false, meta: false },
        });
      }
    }, ESC_FLUSH_MS);
  }

  private async readLoop() {
    while (!this.closed) {
      let value: Uint8Array | undefined;
      try {
        const chunk = await this.reader.read();
        if (chunk.done) break;
        value = chunk.value;
      } catch {
        break;
      }
      if (this.closed) break;
      if (!value || value.length === 0) continue;

      this.clearEscTimer();

      // Append to any incomplete tail from the previous chunk.
      const merged = new Uint8Array(this.pending.length + value.length);
      merged.set(this.pending, 0);
      merged.set(value, this.pending.length);

      const { events, consumed } = decodeInput(merged);
      this.pending = merged.slice(consumed);
      for (const ev of events) this.emit(ev);

      // A leftover ESC-prefixed tail is either a bare Escape or a sequence
      // that arrived split — flush it as Escape if no more bytes follow.
      if (this.pending.length > 0 && this.pending[0] === 0x1b) {
        this.scheduleEscFlush();
      }
    }
    for (const resolver of this.resolvers) {
      resolver({ value: undefined as unknown as KeyEvent, done: true });
    }
    this.resolvers = [];
  }

  async *[Symbol.asyncIterator](): AsyncIterator<KeyEvent> {
    while (!this.closed) {
      const queued = this.queue.shift();
      if (queued) {
        yield queued;
        continue;
      }
      const result = await new Promise<IteratorResult<KeyEvent>>((resolve) => {
        this.resolvers.push(resolve);
      });
      if (result.done) break;
      yield result.value;
    }
  }

  close() {
    this.closed = true;
    this.clearEscTimer();
    try {
      void this.reader.cancel();
    } catch {
      // ignore
    }
    for (const resolver of this.resolvers) {
      resolver({ value: undefined as unknown as KeyEvent, done: true });
    }
    this.resolvers = [];
    this.queue = [];
  }
}

export async function initTerminal() {
  // Terminal.open() already puts stdin into raw mode (no echo, no canonical
  // line editing, ISIG off) so Ctrl+C reaches us as a byte we handle ourselves.
  term = Terminal.open({ syncUpdate: true });

  term.write("\x1b[?1049h"); // enter alternate screen
  term.hideCursor();
  term.clearScreen();
  term.render();

  stream = new InputStream();
  return term;
}

export function getEventStream() {
  return stream;
}

export function getTerminal() {
  return term;
}

export async function cleanupTerminal() {
  if (stream) {
    stream.close();
    stream = null;
  }
  if (term) {
    term.write("\x1b[?1049l"); // leave alternate screen
    term.showCursor();
    term.close(); // restores raw mode + removes signal handlers
    term = null;
  }
}
