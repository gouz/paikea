import { Box, Text } from "ink";
import { colors } from "../theme";

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
  const lineColor = focused ? colors.fg.accent : colors.fg.dim;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={lineColor}>
      <Box>
        <Text color={colors.fg.accent} bold>
          ❯{" "}
        </Text>
        {prompt ? (
          <Text color={colors.fg.primary}>{prompt}</Text>
        ) : (
          <Text color={colors.fg.dim}>type your prompt...</Text>
        )}
        {focused && <Text color={colors.fg.accent}>█</Text>}
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
                  <Text color={colors.fg.dim} italic>
                    {remaining}
                  </Text>
                )}
                <Text color={colors.fg.dim}> tab →</Text>
              </>
            );
          }
          return <Text color={colors.fg.dim}>Enter to send</Text>;
        })()}
      </Box>
    </Box>
  );
}
