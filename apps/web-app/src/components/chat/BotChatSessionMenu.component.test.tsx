import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { BotChatSessionMenu } from "./BotChatSessionMenu";

const mocks = vi.hoisted(() => ({
  changeSession: vi.fn(),
  setSessionPickerOpen: vi.fn(),
  session: null as { title?: string } | null,
  sessionPickerOpen: false,
}));

vi.mock("./ChatProvider", () => ({
  useChat: () => ({
    sessionId: "ses_1",
    directory: "/project",
    changeSession: mocks.changeSession,
    sessionPickerOpen: mocks.sessionPickerOpen,
    setSessionPickerOpen: mocks.setSessionPickerOpen,
  }),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useSession: () => ({ data: mocks.session }),
}));

vi.mock("@/components/session/SessionPickerDialog", () => ({
  SessionPickerDialog: ({ open }: { open?: boolean }) => (
    <div data-testid="session-picker" data-open={String(open)} />
  ),
}));

describe("BotChatSessionMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session = { title: "Support chat" };
    mocks.sessionPickerOpen = false;
  });

  test("renders an icon-only session menu trigger", () => {
    render(<BotChatSessionMenu />);

    expect(
      screen.getByRole("button", { name: "Session menu" }),
    ).toHaveAttribute("aria-haspopup", "menu");
  });

  test("shows the current session title inside the menu", async () => {
    const user = userEvent.setup();
    render(<BotChatSessionMenu />);

    await user.click(screen.getByRole("button", { name: "Session menu" }));

    expect(await screen.findByText("Support chat")).toBeInTheDocument();
  });

  test("falls back to New Bot Chat without a session title", async () => {
    mocks.session = null;
    const user = userEvent.setup();
    render(<BotChatSessionMenu />);

    await user.click(screen.getByRole("button", { name: "Session menu" }));

    expect(await screen.findByText("New Bot Chat")).toBeInTheDocument();
  });

  test("New chat resets the session", async () => {
    const user = userEvent.setup();
    render(<BotChatSessionMenu />);

    await user.click(screen.getByRole("button", { name: "Session menu" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /new chat/i }),
    );

    expect(mocks.changeSession).toHaveBeenCalledWith(null);
  });

  test("Change session opens the session picker", async () => {
    const user = userEvent.setup();
    render(<BotChatSessionMenu />);

    await user.click(screen.getByRole("button", { name: "Session menu" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /change session/i }),
    );

    expect(mocks.setSessionPickerOpen).toHaveBeenCalledWith(true);
  });

  test("mounts the session picker with the provider open state", () => {
    mocks.sessionPickerOpen = true;

    render(<BotChatSessionMenu />);

    expect(screen.getByTestId("session-picker")).toHaveAttribute(
      "data-open",
      "true",
    );
  });
});
