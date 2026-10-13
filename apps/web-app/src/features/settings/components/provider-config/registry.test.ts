import { describe, expect, it } from "vitest";
import { getProviderConfigForm } from "./registry";

describe("provider config form registry", () => {
  it("resolves the form for a supported template", () => {
    expect(getProviderConfigForm("opencode")).toBeDefined();
  });

  it("does not render a form for an unsupported template", () => {
    expect(getProviderConfigForm("unknown-provider")).toBeUndefined();
  });
});
