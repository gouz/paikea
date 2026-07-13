export function hasThinkingSupport(modelId: string): boolean {
  const thinkingModels = [
    "qwen3",
    "deepseek-r1",
    "deepseek-reasoner",
    "o1",
    "o3",
  ];
  const lower = modelId.toLowerCase();
  return thinkingModels.some((m) => lower.includes(m));
}
