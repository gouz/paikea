import type { Model } from "../types";
import { listModels } from "./dmr-client";

let cachedModels: Model[] = [];
let currentIndex = 0;

export async function fetchModels(): Promise<Model[]> {
  cachedModels = await listModels();
  return cachedModels;
}

export function nextModel(): Model | null {
  if (cachedModels.length === 0) return null;
  currentIndex = (currentIndex + 1) % cachedModels.length;
  return cachedModels[currentIndex] ?? null;
}

export function prevModel(): Model | null {
  if (cachedModels.length === 0) return null;
  currentIndex = (currentIndex - 1 + cachedModels.length) % cachedModels.length;
  return cachedModels[currentIndex] ?? null;
}

export function setModelById(id: string): Model | null {
  const idx = cachedModels.findIndex((m) => m.id === id);
  if (idx >= 0) {
    currentIndex = idx;
    return cachedModels[idx] ?? null;
  }
  return null;
}
