import type { Terminal } from "@hexie/tui";
import { drawPanel, drawSectionLabel } from "../renderer/draw";
import { theme } from "../renderer/theme";
import type { AgentStep, Layout } from "../types";

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍",
  get_webpage: "🌐",
  read_file: "📖",
  list_files: "📂",
  write_file: "📝",
  shell_exec: "💻",
};

export function renderAgentSteps(
  term: Terminal,
  layout: Layout,
  steps: AgentStep[],
) {
  if (steps.length === 0) return;

  const { row, col, width, height } = layout.agentSteps;
  if (height === 0) return;

  // Background
  drawPanel(term, row, col, width, height, theme.bg.panelAlt);

  // Section label
  drawSectionLabel(term, row, col, "agent", theme.fg.warning);

  const visibleSteps = steps.slice(-Math.max(0, height - 2));

  for (let i = 0; i < visibleSteps.length; i++) {
    const step = visibleSteps[i];
    if (!step) continue;

    const stepRow = row + 1 + i;
    if (stepRow >= row + height) break;

    const icon = getStepIcon(step);
    const text = getStepText(step);
    const indicator = getStepIndicator(step);
    const display = ` ${icon} ${text} ${indicator}`;

    const truncated =
      display.length > width - 2 ? `${display.slice(0, width - 3)}…` : display;
    const color = getStepColor(step);

    term.putText(stepRow, col, truncated, { fg: color });
  }
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
    case "running":
      return (
        theme.symbols.spinner[
          Math.floor(Date.now() / 100) % theme.symbols.spinner.length
        ] ?? ""
      );
    case "done":
      return theme.symbols.check;
    case "error":
      return theme.symbols.cross;
    default:
      return "";
  }
}

function getStepColor(step: AgentStep): typeof theme.fg.primary {
  if (step.status === "error") return theme.fg.error;
  if (step.status === "running") return theme.fg.accent;
  if (step.type === "tool_call") return theme.fg.warning;
  if (step.type === "tool_result") return theme.fg.success;
  return theme.fg.secondary;
}

function truncateStr(text: string, max: number): string {
  const single = text.replace(/\n/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}
