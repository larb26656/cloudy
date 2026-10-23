import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { QuickCloudy } from "./QuickCloudy";

const mocks = vi.hoisted(() => ({
  hide: vi.fn(),
  openSession: vi.fn(),
  sendMessage: vi.fn(),
  setHeight: vi.fn(),
  useRecentSessions: vi.fn(),
  sessionId: null as string | null,
  providerSessionId: null as string | null,
  chatProviderId: "",
  chatDirectory: "",
  onSessionChange: null as ((sessionId: string | null) => void) | null,
}));

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: () => ({ data: [] }),
  useCapacity: () => ({
    data: {
      approvals: false,
      questions: false,
      fileMentions: false,
      commands: false,
    },
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/components/provider/ProviderIcon", () => ({
  ProviderIcon: ({ providerId }: { providerId: string }) => (
    <span data-testid={`provider-icon-${providerId}`} />
  ),
}));
vi.mock("@/hooks/queries/useSessions", () => ({
  useRecentSessions: mocks.useRecentSessions.mockImplementation(
    ({ search }: { search?: string } = {}) => ({
      data: [
        {
          id: "recent-session",
          providerId: "cloudy",
          title: "Previous question",
          directory: "/project",
        },
        {
          id: "other-provider-session",
          providerId: "other",
          title: "Other provider chat",
          directory: "/project",
        },
      ].filter(
        (session) =>
          !search || session.title.toLowerCase().includes(search.toLowerCase()),
      ),
    }),
  ),
}));
vi.mock("@/components/chat/ChatProvider", () => ({
  ChatProvider: ({
    children,
    providerId,
    directory,
    sessionId,
    onSessionChange,
  }: {
    children: ReactNode;
    providerId: string;
    directory: string;
    sessionId: string | null;
    onSessionChange: (sessionId: string | null) => void;
  }) => {
    mocks.chatProviderId = providerId;
    mocks.chatDirectory = directory;
    mocks.providerSessionId = sessionId;
    mocks.onSessionChange = onSessionChange;
    return children;
  },
  useChat: () => ({
    sessionId: mocks.sessionId ?? mocks.providerSessionId,
    directory: mocks.chatDirectory,
    sendMessage: mocks.sendMessage,
    effectiveModel: null,
    effectiveAgent: null,
    isSending: false,
    capacity: {
      approvals: false,
      questions: false,
      fileMentions: false,
      commands: false,
    },
  }),
}));
vi.mock("@/hooks/session/useSessionHumanApprove", () => ({
  useSessionData: () => ({
    sessionQuestions: [],
    currentQuestion: null,
    sessionPermissions: [],
    currentPermission: null,
  }),
}));
vi.mock("@/components/chat/SessionStatusBar", () => ({
  SessionStatusBar: () => <div data-testid="session-status-bar" />,
}));
vi.mock("@/components/session/SessionPickerDialog", () => ({
  SessionPickerDialog: () => null,
}));
vi.mock("@/components/chat/dialogs/SessionViewDialog", () => ({
  SessionViewDialog: () => null,
}));
vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: () => (
    <div data-testid="shared-chat-input">
      <button onClick={() => mocks.onSessionChange?.(null)}>/new</button>
    </div>
  ),
}));
vi.mock("@/components/chat/message/MessageList", () => ({
  MessageList: () => <div data-testid="message-list" />,
}));
vi.mock("@repo/ui/components/command", () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({
    children,
    heading,
  }: {
    children: ReactNode;
    heading?: string;
  }) => (
    <div>
      {heading && <div>{heading}</div>}
      {children}
    </div>
  ),
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandShortcut: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
  CommandInput: ({
    value,
    onValueChange,
    ...props
  }: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    "aria-label": string;
  }) => (
    <input
      {...props}
      role="combobox"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    />
  ),
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect: () => void;
  }) => (
    <button role="option" onClick={onSelect}>
      {children}
    </button>
  ),
}));
vi.mock("@repo/ui/components/message-scroller", () => ({
  MessageScrollerProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/lib/desktop/quickBridge", () => ({
  quickBridge: {
    hide: mocks.hide,
    openSession: mocks.openSession,
    setHeight: mocks.setHeight,
    onFocusInput: () => () => {},
  },
}));

describe("QuickCloudy", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mocks.sessionId = null;
    mocks.providerSessionId = null;
    mocks.onSessionChange = null;
    mocks.chatProviderId = "";
    mocks.chatDirectory = "";
    mocks.useRecentSessions.mockImplementation(
      ({ search }: { search?: string } = {}) => ({
        data: [
          {
            id: "recent-session",
            providerId: "cloudy",
            title: "Previous question",
            directory: "/project",
          },
          {
            id: "other-provider-session",
            providerId: "other",
            title: "Other provider chat",
            directory: "/project",
          },
        ].filter(
          (session) =>
            !search ||
            session.title.toLowerCase().includes(search.toLowerCase()),
        ),
      }),
    );
  });

  it("offers Ask Cloudy for typed text and starts that prompt", () => {
    render(<QuickCloudy />);
    expect(screen.queryByText("Quick Cloudy")).not.toBeInTheDocument();
    expect(mocks.setHeight).toHaveBeenCalledWith(360);

    fireEvent.change(screen.getByRole("combobox", { name: "Ask Cloudy" }), {
      target: { value: "Explain this code" },
    });
    expect(screen.getByText("Quick Cloudy")).toBeInTheDocument();
    expect(mocks.setHeight).toHaveBeenCalledWith(360);
    const askCloudyItem = screen.getByRole("option", {
      name: /Ask Cloudy “Explain this code”/,
    });
    expect(askCloudyItem).toBeInTheDocument();
    fireEvent.click(askCloudyItem);
    expect(mocks.sendMessage).toHaveBeenCalledWith(
      { text: "Explain this code", mentions: [], attachments: [] },
      null,
      null,
      { newSession: true, providerId: "cloudy" },
    );
  });

  it("shows recent chats from all providers and resumes the selected session", () => {
    render(<QuickCloudy />);

    expect(screen.getByText("Recent chats")).toBeInTheDocument();
    expect(screen.getByText("Previous question")).toBeInTheDocument();
    expect(screen.getByText("Other provider chat")).toBeInTheDocument();
    expect(screen.getByTestId("provider-icon-cloudy")).toBeInTheDocument();
    expect(screen.getByTestId("provider-icon-other")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Previous question" }));
    expect(mocks.setHeight).toHaveBeenCalledWith(640);
    expect(mocks.chatDirectory).toBe("/project");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(
      screen.getByRole("option", { name: "Other provider chat" }),
    );
    expect(mocks.chatProviderId).toBe("other");
    expect(mocks.chatDirectory).toBe("/project");
  });

  it("reuses the shared chat input and opens the current session on demand", () => {
    render(<QuickCloudy />);

    fireEvent.click(screen.getByRole("option", { name: "Previous question" }));
    expect(screen.getByTestId("shared-chat-input")).toBeInTheDocument();
    expect(screen.getByTestId("message-list")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(mocks.openSession).toHaveBeenCalledWith({
      type: "chat",
      data: {
        providerId: "cloudy",
        sessionId: "recent-session",
        workspaceId: null,
        directory: "/project",
        sessionName: "Quick Chat",
      },
    });
  });

  it("keeps the chat view open after /new clears the current session", () => {
    render(<QuickCloudy />);
    fireEvent.click(screen.getByRole("option", { name: "Previous question" }));

    fireEvent.click(screen.getByRole("button", { name: "/new" }));

    expect(screen.getByTestId("shared-chat-input")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open" }),
    ).not.toBeInTheDocument();
  });

  it("hides on Escape", () => {
    render(<QuickCloudy />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mocks.hide).toHaveBeenCalledOnce();
  });
});
