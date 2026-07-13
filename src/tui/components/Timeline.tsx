import { Box, Text } from "ink";
import type { Step } from "../../types";
import { symbols, t } from "../theme";

interface TimelineProps {
  steps: Step[];
  selectedIndex: number;
}

export function Timeline({ steps, selectedIndex }: TimelineProps) {
  if (steps.length === 0) return null;

  return (
    <Box>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isSelected = i === selectedIndex;
        return (
          <Box key={step.id}>
            <Text
              color={
                isSelected
                  ? t().fg.accent
                  : step.status === "done"
                    ? t().fg.success
                    : step.status === "current"
                      ? t().fg.accent
                      : t().fg.dim
              }
              bold={isSelected || step.status === "current"}
            >
              {step.status === "done" || step.status === "current"
                ? symbols.bullet
                : isSelected
                  ? "◆"
                  : symbols.empty}
            </Text>
            <Text> </Text>
            <Text
              color={
                isSelected
                  ? t().fg.accent
                  : step.status === "done"
                    ? t().fg.success
                    : step.status === "current"
                      ? t().fg.accent
                      : t().fg.dim
              }
              bold={isSelected || step.status === "current"}
            >
              {step.name}
            </Text>
            {!isLast && (
              <Text color={t().fg.dim}>
                {" "}
                {symbols.divider}
                {symbols.divider}
                {symbols.divider}{" "}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
