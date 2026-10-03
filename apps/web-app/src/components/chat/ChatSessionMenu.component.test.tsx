import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ChatSessionMenu } from "./ChatSessionMenu";

const mocks = vi.hoisted(() => ({
  onSessionChange: vi.fn(),
  onSwitchProvider: vi.fn(),
}));

vi.mock("@/components/session/SessionPickerDialog", () => ({
  SessionPickerDialog: ({ open }: { open?: boolean }) => (
    <div data-testid="session-picker" data-open={String(open)} />
  ),
}));

vi.mock("./ProviderSwitchDialog", () => ({
  ProviderSwitchDialog: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: (providerId: string) => void;
  }) => (
    <div>
      <div data-testid="provider-switch" data-open={String(open)} />
      {open && (
        <button type="button" onClick={() => onConfirm("openai")}>
          confirm-switch
        </button>
      )}
    </div>
  ),
}));

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Session menu" }));
  return user;
};

const renderMenu = (props?: {
  sessionId?: string | null;
  providerId?: string;
}) =>
  render(
    <ChatSessionMenu
      sessionId={props?.sessionId === undefined ? "ses_1" : props.sessionId}
      directory="/project"
      onSessionChange={mocks.onSessionChange}
      providerId={props?.providerId}
      onSwitchProvider={props?.providerId ? mocks.onSwitchProvider : undefined}
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
    renderMenu();
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /new chat/i }),
    );

    expect(mocks.onSessionChange).toHaveBeenCalledWith(null);
  });

  test("Change session opens the session picker", async () => {
    renderMenu();
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /change session/i }),
    );

    expect(screen.getByTestId("session-picker")).toHaveAttribute(
      "data-open",
      "true",
    );
  });

  test("hides the provider item when provider props are absent", async () => {
    renderMenu();
    await openMenu();

    expect(
      screen.queryByRole("menuitem", { name: /provider/i }),
    ).not.toBeInTheDocument();
  });

  test("provider item continues with another provider when a session exists", async () => {
    renderMenu({ providerId: "opencode" });
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", {
        name: /continue with another provider/i,
      }),
    );

    expect(screen.getByTestId("provider-switch")).toHaveAttribute(
      "data-open",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "confirm-switch" }));

    expect(mocks.onSwitchProvider).toHaveBeenCalledWith("openai");
  });

  test("provider item switches provider when no session exists", async () => {
    renderMenu({ sessionId: null, providerId: "opencode" });
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /^switch provider/i }),
    );

    expect(screen.getByTestId("provider-switch")).toHaveAttribute(
      "data-open",
      "true",
    );
  });
});
