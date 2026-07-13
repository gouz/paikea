import { Box, Text } from "ink";
import { t } from "../theme";

interface PromptInputProps {
  prompt: string;
  cursorPos: number;
  focused: boolean;
  suggestions: string[];
  suggestionIndex: number;
}

export function PromptInput({
  prompt,
  cursorPos: _cursorPos,
  focused,
  suggestions,
  suggestionIndex,
}: PromptInputProps) {
  const lineColor = focused ? t().fg.accent : t().fg.dim;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={lineColor}>
      <Box>
        <Text color={t().fg.accent} bold>
          ❯{" "}
        </Text>
        {prompt ? (
          <Text color={t().fg.primary}>{prompt}</Text>
        ) : (
          <Text color={t().fg.dim}>type your prompt...</Text>
        )}
        {focused && <Text color={t().fg.accent}>█</Text>}
      </Box>
      <Box>
        {(() => {
          const suggestion =
            suggestionIndex >= 0
              ? suggestions[suggestionIndex]
              : suggestions[0];
          if (suggestion && focused) {
            const remaining = suggestion.slice(prompt.length);
            return (
              <>
                {remaining && (
                  <Text color={t().fg.dim} italic>
                    {remaining}
                  </Text>
                )}
                <Text color={t().fg.dim}> tab →</Text>
              </>
            );
          }
          return <Text color={t().fg.dim}>Enter to send</Text>;
        })()}
      </Box>
    </Box>
  );
}
