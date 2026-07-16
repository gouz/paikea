import { Box, Text } from "ink";
import { formatTokenCount, type RtkSavings } from "../../services/rtk";
import type { Model } from "../../types";
import { useElapsed, useSpinner } from "../hooks/use-spinner";
import { t } from "../theme";

interface StatusBarProps {
  model: Model | null;
  stepName: string | null;
  tokens: number;
  streaming: boolean;
  confirmQuit: boolean;
  canFocusPanes: boolean;
  notice: string;
  rtkSavings: RtkSavings | null;
}

// The whole bar is a single Text with truncate-end so it never wraps to a
// second line and breaks the fixed-height layout on narrow terminals.
export function StatusBar({
  model,
  stepName,
  tokens,
  streaming,
  confirmQuit,
  canFocusPanes,
  notice,
  rtkSavings,
}: StatusBarProps) {
  const spinner = useSpinner(streaming);
  const elapsed = useElapsed(streaming);

  if (notice && !streaming && !confirmQuit) {
    return (
      <Box height={1}>
        <Text wrap="truncate-end">
          <Text color={t().fg.success} bold>
            {" "}
            ✓ {notice}
          </Text>
        </Text>
      </Box>
    );
  }

  if (confirmQuit) {
    return (
      <Box height={1}>
        <Text wrap="truncate-end">
          <Text color={t().fg.warning} bold>
            {" "}
            quit paikea? esc again to confirm{" "}
          </Text>
          <Text color={t().fg.dim}>· any other key to stay</Text>
        </Text>
      </Box>
    );
  }

  if (streaming) {
    return (
      <Box height={1}>
        <Text wrap="truncate-end">
          <Text color={t().fg.accent} bold>
            {" "}
            {spinner} generating
          </Text>
          <Text color={t().fg.dim}>
            {" "}
            · {model?.name ?? "none"} · {elapsed}s
            {tokens > 0 ? ` · thinking ${tokens}` : ""} · esc to cancel
          </Text>
        </Text>
      </Box>
    );
  }

  return (
    <Box height={1}>
      <Text wrap="truncate-end">
        {stepName ? (
          <Text color={t().fg.accent}> · cap {stepName.toLowerCase()}</Text>
        ) : null}
        {tokens > 0 ? (
          <Text color={t().fg.dim}> · thinking {tokens}</Text>
        ) : null}
        {rtkSavings ? (
          <Text color={t().fg.success}>
            {" "}
            · rtk {formatTokenCount(rtkSavings.totalSaved)} saved (
            {rtkSavings.avgSavingsPct.toFixed(0)}%)
          </Text>
        ) : null}
        <Text color={t().fg.dim}>
          {" "}
          · ↑↓ scroll{canFocusPanes ? " · ctrl+t pane" : ""} · tab model · /step
          switch · ctrl+p palette · esc quit
        </Text>
      </Text>
    </Box>
  );
}
