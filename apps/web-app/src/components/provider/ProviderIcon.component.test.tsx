import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useModels } from "@/hooks/queries/useModels";
import { ProviderIcon } from "./ProviderIcon";

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: vi.fn(() => ({ data: [] })),
}));

describe("ProviderIcon", () => {
  it("renders the OpenCode mark", () => {
    vi.mocked(useModels).mockReturnValue({
      data: [{ id: "opencode", providerType: "opencode" }],
    } as ReturnType<typeof useModels>);
    render(<ProviderIcon providerId="opencode" />);

    expect(screen.getByRole("img", { name: "OpenCode" })).toBeInTheDocument();
  });

  it("renders a fallback icon for an unsupported provider", () => {
    vi.mocked(useModels).mockReturnValue({
      data: [],
    } as ReturnType<typeof useModels>);
    const { container } = render(<ProviderIcon providerId="codex" />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("selects the icon by provider type rather than instance ID", () => {
    vi.mocked(useModels).mockReturnValue({
      data: [{ id: "local-opencode", providerType: "opencode" }],
    } as ReturnType<typeof useModels>);
    render(<ProviderIcon providerId="local-opencode" />);

    expect(screen.getByRole("img", { name: "OpenCode" })).toBeInTheDocument();
  });
});
