import { describe, expect, it } from "bun:test";

// We need to test the model registry logic directly
// Since it uses module-level state, we'll test the pure functions

describe("Model Registry", () => {
  it("should handle nextModel with empty models", async () => {
    const { nextModel } = await import("../services/model-registry");
    // With no models loaded, should return null
    const result = nextModel();
    expect(result).toBeNull();
  });

  it("should handle prevModel with empty models", async () => {
    const { prevModel } = await import("../services/model-registry");
    const result = prevModel();
    expect(result).toBeNull();
  });

  it("should handle setModelById with no models", async () => {
    const { setModelById } = await import("../services/model-registry");
    const result = setModelById("nonexistent");
    expect(result).toBeNull();
  });
});
