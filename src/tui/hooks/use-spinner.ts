import { useEffect, useState } from "react";
import { symbols } from "../theme";

export function useSpinner(active: boolean): string {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setFrame((f) => (f + 1) % symbols.spinner.length),
      80,
    );
    return () => clearInterval(id);
  }, [active]);

  return symbols.spinner[frame] ?? "";
}

export function useElapsed(active: boolean): number {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!active) {
      setStart(null);
      return;
    }
    setStart(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active || start === null) return 0;
  return Math.floor((now - start) / 1000);
}
