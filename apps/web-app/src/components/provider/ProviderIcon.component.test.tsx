import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderIcon } from "./ProviderIcon";

describe("ProviderIcon", () => {
  it("renders the OpenCode mark", () => {
    render(<ProviderIcon providerId="opencode" />);

    expect(screen.getByRole("img", { name: "OpenCode" })).toBeInTheDocument();
  });

  it("renders a fallback icon for an unsupported provider", () => {
    const { container } = render(<ProviderIcon providerId="codex" />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
