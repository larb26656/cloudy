import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ChatSessionMenu } from "./ChatSessionMenu";

const mocks = vi.hoisted(() => ({
  onSessionChange: vi.fn(),
}));

vi.mock("@/components/session/SessionPickerDialog", () => ({
  SessionPickerDialog: ({ open }: { open?: boolean }) => (
    <div data-testid="session-picker" data-open={String(open)} />
  ),
}));

const renderMenu = () =>
  render(
    <ChatSessionMenu
      sessionId="ses_1"
      directory="/project"
      onSessionChange={mocks.onSessionChange}
    />,
  );

describe("ChatSessionMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders an icon-only session menu trigger", () => {
    renderMenu();

    expect(
      screen.getByRole("button", { name: "Session menu" }),
    ).toHaveAttribute("aria-haspopup", "menu");
  });

  test("New chat resets the session", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Session menu" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /new chat/i }),
    );

    expect(mocks.onSessionChange).toHaveBeenCalledWith(null);
  });

  test("Change session opens the session picker", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Session menu" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /change session/i }),
    );

    expect(screen.getByTestId("session-picker")).toHaveAttribute(
      "data-open",
      "true",
    );
  });
});
