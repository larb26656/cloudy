import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useSessionAgentActivity } from "./useSessionAgentActivity";

const mocks = vi.hoisted(() => ({
  useModels: vi.fn(),
  useSession: vi.fn(),
  useSessionPermissions: vi.fn(),
  useSessionQuestions: vi.fn(),
  useStreamingMessagesStore: vi.fn(),
}));

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: mocks.useModels,
}));
vi.mock("@/hooks/queries/useSessions", () => ({
  useSession: mocks.useSession,
}));
vi.mock("@/hooks/queries/usePermissions", () => ({
  useSessionPermissions: mocks.useSessionPermissions,
}));
vi.mock("@/hooks/queries/useQuestions", () => ({
  useSessionQuestions: mocks.useSessionQuestions,
}));
vi.mock("@/stores/streamingMessagesStore", () => ({
  useStreamingMessagesStore: mocks.useStreamingMessagesStore,
}));

describe("useSessionAgentActivity", () => {
  beforeEach(() => {
    mocks.useStreamingMessagesStore.mockImplementation((selector) =>
      selector({ streamingMessages: new Map() }),
    );
    mocks.useModels.mockReturnValue({
      data: [
        {
          id: "opencode",
          capabilities: { approvals: true, questions: true },
        },
      ],
      isLoading: false,
      error: null,
    });
    mocks.useSession.mockReturnValue({
      data: {
        id: "session-1",
        providerId: "opencode",
        status: "active",
        runStatus: "running",
      },
      isLoading: false,
      error: null,
    });
    mocks.useSessionQuestions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    mocks.useSessionPermissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  test("returns activity for the requested session id", () => {
    const { result } = renderHook(() => useSessionAgentActivity("session-1"));

    expect(result.current).toMatchObject({
      state: "working",
      isLoading: false,
    });
    expect(mocks.useSession).toHaveBeenCalledWith({ sessionId: "session-1" });
  });

  test("shows working when the provider has no permission capabilities", () => {
    mocks.useModels.mockReturnValue({
      data: [{ id: "opencode", capabilities: {} }],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionAgentActivity("session-1"));

    expect(result.current.state).toBe("working");
    expect(mocks.useSessionQuestions).toHaveBeenCalledWith({
      sessionId: "session-1",
      enabled: false,
    });
    expect(mocks.useSessionPermissions).toHaveBeenCalledWith({
      sessionId: "session-1",
      enabled: false,
    });
  });

  test("shows working while session messages are streaming", () => {
    mocks.useSession.mockReturnValue({
      data: {
        id: "session-1",
        providerId: "opencode",
        status: "idle",
        runStatus: "idle",
      },
      isLoading: false,
      error: null,
    });
    mocks.useStreamingMessagesStore.mockImplementation((selector) =>
      selector({
        streamingMessages: new Map([
          ["session-1", new Map([["message-1", {}]])],
        ]),
      }),
    );

    const { result } = renderHook(() => useSessionAgentActivity("session-1"));

    expect(result.current.state).toBe("working");
  });

  test("prioritizes a question waiting for a response", () => {
    mocks.useSessionQuestions.mockReturnValue({
      data: [{ id: "question-1" }],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionAgentActivity("session-1"));

    expect(result.current).toMatchObject({
      state: "wait-for-human",
      reason: "question",
    });
  });

  test("returns idle for a session that is not running", () => {
    mocks.useSession.mockReturnValue({
      data: {
        id: "session-1",
        providerId: "opencode",
        status: "idle",
        runStatus: "completed",
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionAgentActivity("session-1"));

    expect(result.current.state).toBe("idle");
    expect(mocks.useSessionQuestions).toHaveBeenCalledWith({
      sessionId: "session-1",
      enabled: false,
    });
  });
});
