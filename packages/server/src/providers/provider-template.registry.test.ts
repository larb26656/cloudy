import { describe, expect, it } from "vitest";
import { createProviderTemplateRegistry } from "./provider-template.registry";

describe("provider template registry", () => {
  it("lists the supported templates", () => {
    expect(createProviderTemplateRegistry().list()).toEqual([
      {
        id: "opencode",
        name: "OpenCode",
        description: "Connect to an OpenCode server.",
      },
    ]);
  });

  it("creates an adapter with the instance identity", () => {
    const adapter = createProviderTemplateRegistry().create({
      id: "local-opencode",
      name: "Local OpenCode",
      templateId: "opencode",
      enabled: true,
      baseUrl: "http://localhost:4096",
    });

    expect(adapter.id).toBe("local-opencode");
  });
});
