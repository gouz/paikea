export interface Layout {
  header: { row: number; col: number; width: number; height: number };
  timeline: { row: number; col: number; width: number; height: number };
  thinking: { row: number; col: number; width: number; height: number };
  agentSteps: { row: number; col: number; width: number; height: number };
  result: { row: number; col: number; width: number; height: number };
  input: { row: number; col: number; width: number; height: number };
  status: { row: number; col: number; width: number; height: number };
}

export function calculateLayout(
  rows: number,
  cols: number,
  thinkingVisible: boolean,
  agentStepCount = 0,
): Layout {
  const headerHeight = 1;
  const timelineHeight = 1;
  const inputHeight = 3;
  const statusHeight = 1;
  const padding = 1;

  const fixedHeight =
    headerHeight + timelineHeight + inputHeight + statusHeight;
  const availableHeight = rows - fixedHeight;

  const thinkingHeight = thinkingVisible
    ? Math.floor(availableHeight * 0.3)
    : 0;
  const agentStepsHeight = agentStepCount > 0 ? Math.min(agentStepCount, 6) : 0;
  const resultHeight = availableHeight - thinkingHeight - agentStepsHeight;

  let currentRow = 0;

  const header = { row: currentRow, col: 0, width: cols, height: headerHeight };
  currentRow += headerHeight;

  const timeline = {
    row: currentRow,
    col: 0,
    width: cols,
    height: timelineHeight,
  };
  currentRow += timelineHeight;

  const thinking = {
    row: currentRow,
    col: padding,
    width: cols - padding * 2,
    height: thinkingHeight,
  };
  currentRow += thinkingHeight;

  const agentSteps = {
    row: currentRow,
    col: padding,
    width: cols - padding * 2,
    height: agentStepsHeight,
  };
  currentRow += agentStepsHeight;

  const result = {
    row: currentRow,
    col: padding,
    width: cols - padding * 2,
    height: resultHeight,
  };
  currentRow += resultHeight;

  const input = {
    row: currentRow,
    col: padding,
    width: cols - padding * 2,
    height: inputHeight,
  };
  currentRow += inputHeight;

  const status = { row: currentRow, col: 0, width: cols, height: statusHeight };

  return { header, timeline, thinking, agentSteps, result, input, status };
}
