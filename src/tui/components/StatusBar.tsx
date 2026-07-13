import { Box, Text } from "ink";
import type { Model } from "../../types";
import { symbols, t } from "../theme";

interface StatusBarProps {
  model: Model | null;
  tokens: number;
  streaming: boolean;
  confirmQuit: boolean;
}

export function StatusBar({
  model,
  tokens,
  streaming,
  confirmQuit,
}: StatusBarProps) {
  return (
    <Box>
      {confirmQuit ? (
        <Text color={t().fg.accent} bold>
          {" "}
          sure quit? (esc again){" "}
        </Text>
      ) : streaming ? (
        <Text color={t().fg.accent} bold>
          {" "}
          {
            symbols.spinner[
              Math.floor(Date.now() / 100) % symbols.spinner.length
            ]
          }{" "}
          streaming{" "}
        </Text>
      ) : (
        <>
          <Text color={t().fg.primary}>
            {" "}
            {symbols.gear} {model?.name ?? "none"}
          </Text>
          <Text color={t().fg.dim}> · tokens {tokens}</Text>
          <Text> </Text>
          <Text color={t().fg.dim}>ctrl+p palette · esc quit</Text>
        </>
      )}
    </Box>
  );
}
