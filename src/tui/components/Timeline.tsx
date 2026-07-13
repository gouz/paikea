import { Box, Text } from "ink";
import type { Step } from "../../types";
import { colors, symbols } from "../theme";

interface TimelineProps {
  steps: Step[];
}

export function Timeline({ steps }: TimelineProps) {
  if (steps.length === 0) return null;

  return (
    <Box>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <Box key={step.id}>
            <Text
              color={
                step.status === "done"
                  ? colors.fg.success
                  : step.status === "current"
                    ? colors.fg.accent
                    : colors.fg.dim
              }
              bold={step.status === "current"}
            >
              {step.status === "done" || step.status === "current"
                ? symbols.bullet
                : symbols.empty}
            </Text>
            <Text> </Text>
            <Text
              color={
                step.status === "done"
                  ? colors.fg.success
                  : step.status === "current"
                    ? colors.fg.accent
                    : colors.fg.dim
              }
              bold={step.status === "current"}
            >
              {step.name}
            </Text>
            {!isLast && (
              <Text color={colors.fg.dim}>
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
