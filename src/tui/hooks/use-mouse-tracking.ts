import { useEffect } from "react";

// SGR mouse tracking: 1002 = report button press/release plus motion while a
// button is held (drag), 1006 = extended SGR encoding so coordinates aren't
// capped at 223. Enabling this hands mouse events to the app and disables the
// terminal's own text selection, which is why we own copy-to-clipboard.
const ESC = "\x1b";
const ENABLE = `${ESC}[?1002h${ESC}[?1006h`;
const DISABLE = `${ESC}[?1002l${ESC}[?1006l`;

export function useMouseTracking(): void {
  useEffect(() => {
    if (!process.stdout.isTTY) return;

    process.stdout.write(ENABLE);

    // Belt-and-suspenders: if the app is killed hard (crash, SIGINT before
    // Ink unmounts) the escape codes above would otherwise stay latched on the
    // user's terminal, breaking normal mouse selection until they reset it.
    const restore = () => {
      process.stdout.write(DISABLE);
    };
    process.on("exit", restore);

    return () => {
      process.off("exit", restore);
      restore();
    };
  }, []);
}
