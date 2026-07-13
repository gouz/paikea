import { Box, Text } from "ink";
import { t } from "../theme";

interface PromptInputProps {
  prompt: string;
  cursorPos: number;
  focused: boolean;
  suggestions: string[];
  suggestionIndex: number;
  disabled: boolean;
}

export function PromptInput({
  prompt,
  cursorPos,
  focused,
  suggestions,
  suggestionIndex,
  disabled,
}: PromptInputProps) {
  const lineColor = focused && !disabled ? t().fg.accent : t().fg.dim;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={lineColor}>
      <Box>
        <Text color={lineColor} bold>
          ❯{" "}
        </Text>
        {prompt ? (
          <PromptText
            prompt={prompt}
            cursorPos={cursorPos}
            showCursor={focused && !disabled}
          />
        ) : (
          <>
            <Text color={t().fg.dim}>
              {disabled
                ? "generating… (esc to cancel)"
                : "cast off — set a course…"}
            </Text>
            {focused && !disabled && <Text color={t().fg.accent}>█</Text>}
          </>
        )}
      </Box>
      <Box>
        {(() => {
          const suggestion =
            suggestionIndex >= 0
              ? suggestions[suggestionIndex]
              : suggestions[0];
          if (suggestion && focused && !disabled) {
            const remaining = suggestion.startsWith(prompt)
              ? suggestion.slice(prompt.length)
              : suggestion;
            return (
              <>
                {remaining && (
                  <Text color={t().fg.dim} italic wrap="truncate-end">
                    {remaining}
                  </Text>
                )}
                <Text color={t().fg.muted}> ⇥ tab</Text>
              </>
            );
          }
          return (
            <Text color={t().fg.muted}>{disabled ? " " : "enter to send"}</Text>
          );
        })()}
      </Box>
    </Box>
  );
}

function PromptText({
  prompt,
  cursorPos,
  showCursor,
}: {
  prompt: string;
  cursorPos: number;
  showCursor: boolean;
}) {
  if (!showCursor) {
    return <Text color={t().fg.primary}>{prompt}</Text>;
  }

  const before = prompt.slice(0, cursorPos);
  const at = prompt[cursorPos] ?? " ";
  const after = prompt.slice(cursorPos + 1);

  return (
    <Text color={t().fg.primary}>
      {before}
      <Text inverse>{at}</Text>
      {after}
    </Text>
  );
}
