import { describe, expect, it } from "vitest";
import { createOmpAdapter } from "./omp.adapter";

describe("createOmpAdapter", () => {
  it("uses the fixed OMP ACP launch profile", async () => {
    const adapter = createOmpAdapter();

    expect(adapter.id).toBe("omp");
    expect(await adapter.getInfo()).toMatchObject({
      id: "omp",
      providerType: "acp",
      name: "OMP",
      metadata: { command: "omp", args: ["acp"] },
    });
  });

  it("allows a distinct provider identity", async () => {
    const adapter = createOmpAdapter({
      id: "local-omp",
      name: "Local OMP",
    });

    expect(await adapter.getInfo()).toMatchObject({
      id: "local-omp",
      name: "Local OMP",
      agents: [{ id: "local-omp", name: "Local OMP" }],
    });
  });
});
