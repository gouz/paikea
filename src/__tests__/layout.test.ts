import { describe, expect, it } from "bun:test";
import { calculateLayout } from "../renderer/layout";

describe("calculateLayout", () => {
  it("should calculate layout for standard terminal", () => {
    const layout = calculateLayout(24, 80, false);

    expect(layout.header.row).toBe(0);
    expect(layout.header.height).toBe(1);
    expect(layout.timeline.row).toBe(1);
    expect(layout.timeline.height).toBe(1);
    expect(layout.input.row).toBe(20);
    expect(layout.input.height).toBe(3);
    expect(layout.status.row).toBe(23);
    expect(layout.status.height).toBe(1);
  });

  it("should calculate layout with thinking visible", () => {
    const layout = calculateLayout(24, 80, true);

    expect(layout.thinking.height).toBeGreaterThan(0);
    expect(layout.result.height).toBeGreaterThan(0);
  });

  it("should calculate layout with thinking hidden", () => {
    const layout = calculateLayout(24, 80, false);

    expect(layout.thinking.height).toBe(0);
    expect(layout.result.height).toBeGreaterThan(0);
  });

  it("should handle small terminals", () => {
    const layout = calculateLayout(10, 40, false);

    expect(layout.header.width).toBeLessThanOrEqual(40);
    expect(layout.result.width).toBeLessThanOrEqual(40);
  });

  it("should have consistent row positions", () => {
    const layout = calculateLayout(24, 80, false);

    expect(layout.header.row).toBe(0);
    expect(layout.timeline.row).toBe(layout.header.row + layout.header.height);
    expect(layout.status.row).toBe(23);
    expect(layout.input.row).toBe(layout.status.row - layout.input.height);
  });

  it("should allocate space correctly with thinking", () => {
    const layoutWithThinking = calculateLayout(24, 80, true);
    const layoutWithoutThinking = calculateLayout(24, 80, false);

    expect(layoutWithThinking.result.height).toBeLessThan(
      layoutWithoutThinking.result.height,
    );
  });

  it("should include agentSteps zone", () => {
    const layout = calculateLayout(24, 80, false, 4);

    expect(layout.agentSteps.height).toBe(4);
    expect(layout.agentSteps.row).toBe(
      layout.thinking.row + layout.thinking.height,
    );
  });

  it("should hide agentSteps when count is 0", () => {
    const layout = calculateLayout(24, 80, false, 0);

    expect(layout.agentSteps.height).toBe(0);
  });

  it("should cap agentSteps at 6", () => {
    const layout = calculateLayout(24, 80, false, 10);

    expect(layout.agentSteps.height).toBe(6);
  });
});
