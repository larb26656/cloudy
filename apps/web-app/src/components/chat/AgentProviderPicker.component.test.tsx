import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentProviderPicker } from "./AgentProviderPicker";

const mocks = vi.hoisted(() => ({ isMobile: false }));

vi.mock("@/hooks/useDeviceType", () => ({
  useDeviceType: () => ({ isMobile: mocks.isMobile }),
}));

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: () => ({
    data: [
      {
        id: "codex",
        name: "Codex",
        agents: [
          { id: "build", name: "Build", description: "Build and edit code" },
        ],
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/components/provider/ProviderIcon", () => ({
  ProviderIcon: () => null,
}));

describe("AgentProviderPicker", () => {
  beforeEach(() => {
    mocks.isMobile = false;
  });

  it("shows a dialog on desktop and selects an agent with its provider", () => {
    const onSelect = vi.fn();
    render(<AgentProviderPicker label="New chat" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Build/ }));

    expect(onSelect).toHaveBeenCalledWith("codex", "build");
  });

  it("shows a sheet on mobile", () => {
    mocks.isMobile = true;
    render(<AgentProviderPicker label="New chat" onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("Choose an agent provider to start a chat."),
    ).toBeInTheDocument();
  });
});
