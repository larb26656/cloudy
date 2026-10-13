import { describe, expect, it } from "vitest";
import { createCloudyAdapter } from "./cloudy.adapter";

describe("createCloudyAdapter", () => {
  it("does not require a directory", async () => {
    const adapter = createCloudyAdapter();

    expect((await adapter.getInfo()).capabilities.requiresDirectory).toBe(
      false,
    );
  });
});
