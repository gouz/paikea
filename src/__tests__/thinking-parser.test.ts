import { describe, expect, it } from "bun:test";
import { hasThinkingSupport } from "../services/thinking-parser";

describe("hasThinkingSupport", () => {
  it("should return true for qwen3 models", () => {
    expect(hasThinkingSupport("ai/qwen3")).toBe(true);
    expect(hasThinkingSupport("qwen3:latest")).toBe(true);
  });

  it("should return true for deepseek-r1", () => {
    expect(hasThinkingSupport("deepseek-r1")).toBe(true);
    expect(hasThinkingSupport("deepseek-reasoner")).toBe(true);
  });

  it("should return true for openai o-series", () => {
    expect(hasThinkingSupport("o1")).toBe(true);
    expect(hasThinkingSupport("o3")).toBe(true);
  });

  it("should return false for non-thinking models", () => {
    expect(hasThinkingSupport("llama3")).toBe(false);
    expect(hasThinkingSupport("mistral")).toBe(false);
    expect(hasThinkingSupport("gpt-4")).toBe(false);
  });

  it("should be case insensitive", () => {
    expect(hasThinkingSupport("QWEN3")).toBe(true);
    expect(hasThinkingSupport("DeepSeek-R1")).toBe(true);
  });
});
