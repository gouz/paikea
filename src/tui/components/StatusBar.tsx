import { Box, Text } from "ink";
import type { Model } from "../../types";
import { symbols, t } from "../theme";

interface StatusBarProps {
  model: Model | null;
  tokens: number;
  streaming: boolean;
  toolbarIndex: number;
  isToolbarMode: boolean;
  confirmQuit: boolean;
}

const TOOLBAR_BUTTONS = [
  { label: "⚙ Model", id: "model" },
  { label: "💭 Thinking", id: "thinking" },
  { label: "🗑 Clear", id: "clear" },
  { label: "📋 Palette", id: "palette" },
];

export function StatusBar({
  model: _model,
  tokens,
  streaming,
  toolbarIndex,
  isToolbarMode,
  confirmQuit,
}: StatusBarProps) {
  return (
    <Box>
      {confirmQuit ? (
        <Text color={t().fg.accent} bold>
          {" "}
          sure quit? (esc again){" "}
        </Text>
      ) : (
        <>
          <Text color={t().fg.dim}> tokens {tokens}</Text>
          <Text> </Text>
          {!streaming ? (
            TOOLBAR_BUTTONS.map((btn, i) => {
              const isSelected = isToolbarMode && i === toolbarIndex;
              return (
                <Text key={btn.id}>
                  <Text
                    color={isSelected ? t().fg.accent : t().fg.dim}
                    bold={isSelected}
                  >
                    {" "}
                    {btn.label}{" "}
                  </Text>
                </Text>
              );
            })
          ) : (
            <Text color={t().fg.accent} bold>
              {" "}
              {
                symbols.spinner[
                  Math.floor(Date.now() / 100) % symbols.spinner.length
                ]
              }{" "}
              streaming{" "}
            </Text>
          )}
          <Text> </Text>
          {streaming ? (
            <Text> </Text>
          ) : isToolbarMode ? (
            <Text color={t().fg.dim}> Tab/Enter </Text>
          ) : (
            <Text color={t().fg.dim}> ctrl+p palette </Text>
          )}
        </>
      )}
    </Box>
  );
}
