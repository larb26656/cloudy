import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { Agent } from "@/types/agent";
import { AgentSelector } from "./AgentSelector";

const agents: Agent[] = [
  {
    name: "build",
    description: "Build the application",
    mode: "primary",
    native: true,
  },
  {
    name: "review",
    description: "Review the current change",
    mode: "subagent",
  },
];

const mocks = vi.hoisted(() => ({
  effectiveAgent: null as string | null,
  setAgent: vi.fn(),
}));

vi.mock("@/hooks/queries/useAgents", () => ({
  useAgents: () => ({ data: agents, isLoading: false, error: null }),
}));

vi.mock("./ChatProvider", () => ({
  useChat: () => ({
    effectiveAgent: mocks.effectiveAgent,
    setAgent: mocks.setAgent,
    directory: "/project",
  }),
}));

const originalInnerWidth = window.innerWidth;

describe("AgentSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effectiveAgent = null;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
  });

  test("uses a dropdown menu trigger on desktop", () => {
    render(<AgentSelector />);

    expect(
      screen.getByRole("button", { name: "Default Agent" }),
    ).toHaveAttribute("aria-haspopup", "menu");
    expect(
      screen.queryByRole("heading", { name: "Select agent" }),
    ).not.toBeInTheDocument();
  });

  test("uses a drawer on mobile and selects an agent", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });
    const user = userEvent.setup();
    render(<AgentSelector />);

    await user.click(screen.getByRole("button", { name: "Default Agent" }));

    expect(
      screen.getByRole("heading", { name: "Select agent" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /review/i }));

    expect(mocks.setAgent).toHaveBeenCalledWith("review");
  });
});
