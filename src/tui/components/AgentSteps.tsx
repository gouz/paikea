import { Box, Text } from "ink";
import type { AgentStep } from "../../types";
import { useSpinner } from "../hooks/use-spinner";
import { symbols, t } from "../theme";

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍",
  get_webpage: "🌐",
  read_file: "📖",
  list_files: "📂",
  write_file: "📝",
  shell_exec: "💻",
};

interface AgentStepsProps {
  steps: AgentStep[];
  maxHeight: number;
}

export function AgentSteps({ steps, maxHeight }: AgentStepsProps) {
  const running = steps.some((s) => s.status === "running");
  const spinner = useSpinner(running);

  if (steps.length === 0 || maxHeight < 2) return null;

  // Show the most recent steps so activity stays visible
  const visibleSteps = steps.slice(-Math.max(1, maxHeight - 2));
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={t().fg.warning}
      height={maxHeight}
    >
      <Text color={t().fg.warning} bold>
        ── agent · {doneCount}/{steps.length} ──
      </Text>
      {visibleSteps.map((step) => {
        const icon = getStepIcon(step);
        const text = getStepText(step);
        const indicator =
          step.status === "running" ? spinner : getStepIndicator(step);
        const color = getStepColor(step);

        return (
          <Text key={step.id} color={color} wrap="truncate-end">
            {icon} {text} {indicator}
          </Text>
        );
      })}
    </Box>
  );
}

function getStepIcon(step: AgentStep): string {
  if (step.type === "tool_call" || step.type === "tool_result") {
    return TOOL_ICONS[step.name ?? ""] ?? "🔧";
  }
  return "💬";
}

function getStepText(step: AgentStep): string {
  switch (step.type) {
    case "tool_call": {
      const args = step.arguments
        ? Object.values(step.arguments).join(", ")
        : "";
      return `${step.name}(${truncateStr(args, 40)})`;
    }
    case "tool_result":
      return `${step.name}: ${truncateStr(step.content ?? "", 50)}`;
    case "thinking":
      return truncateStr(step.content ?? "", 50);
    case "content":
      return truncateStr(step.content ?? "", 50);
    default:
      return "";
  }
}

function getStepIndicator(step: AgentStep): string {
  switch (step.status) {
    case "done":
      return symbols.check;
    case "error":
      return symbols.cross;
    default:
      return "";
  }
}

function getStepColor(step: AgentStep): string {
  if (step.status === "error") return t().fg.error;
  if (step.status === "running") return t().fg.accent;
  if (step.type === "tool_call") return t().fg.warning;
  if (step.type === "tool_result") return t().fg.success;
  return t().fg.secondary;
}

function truncateStr(text: string, max: number): string {
  const single = text.replace(/\n/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}
