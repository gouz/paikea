import { useEffect, useState } from "react";

export function useTerminalSize() {
  const [size, setSize] = useState({
    rows: process.stdout.rows ?? 24,
    columns: process.stdout.columns ?? 80,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        rows: process.stdout.rows ?? 24,
        columns: process.stdout.columns ?? 80,
      });
    };
    process.stdout.on("resize", onResize);
    return () => {
      process.stdout.off("resize", onResize);
    };
  }, []);

  return size;
}

const FIXED_LINES = 9;

export interface LayoutOptions {
  showThinking: boolean;
  showAgent: boolean;
}

export function useLayout({ showThinking, showAgent }: LayoutOptions) {
  const { rows, columns } = useTerminalSize();
  const contentHeight = Math.max(4, rows - FIXED_LINES);

  const thinkingMax = showThinking
    ? Math.min(Math.floor(contentHeight * 0.25), 8)
    : 0;
  const agentMax = showAgent
    ? Math.min(Math.floor(contentHeight * 0.25), 6)
    : 0;
  const resultHeight = Math.max(3, contentHeight - thinkingMax - agentMax);

  return { contentHeight, thinkingMax, agentMax, resultHeight, columns, rows };
}
