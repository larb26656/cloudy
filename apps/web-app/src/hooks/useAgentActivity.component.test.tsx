import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useAgentActivity } from "./useAgentActivity";

const mocks = vi.hoisted(() => ({
  permissions: vi.fn(),
  questions: vi.fn(),
  useModels: vi.fn(),
  useRecentSessions: vi.fn(),
  useWorkspaces: vi.fn(),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useRecentSessions: mocks.useRecentSessions,
}));

vi.mock("@/hooks/queries", () => ({
  useModels: mocks.useModels,
  useWorkspaces: mocks.useWorkspaces,
}));

vi.mock("@/lib/api", () => ({
  cloudyClient: {
    api: {
      sessions: {
        ":sessionId": {
          questions: {
            $get: ({ param }: { param: { sessionId: string } }) =>
              mocks.questions(param.sessionId),
          },
          permissions: {
            $get: ({ param }: { param: { sessionId: string } }) =>
              mocks.permissions(param.sessionId),
          },
        },
      },
    },
  },
}));

const sessions = [
  {
    id: "working",
    providerId: "agent",
    directory: "/working",
    status: "active",
    runStatus: "running",
    updatedAt: 100,
  },
  {
    id: "permission",
    providerId: "agent",
    directory: "/permission",
    status: "active",
    runStatus: "running",
    updatedAt: 200,
  },
  {
    id: "question",
    providerId: "agent",
    directory: "/question",
    status: "active",
    runStatus: "running",
    updatedAt: 300,
  },
  {
    id: "unsupported",
    providerId: "basic",
    directory: "/unsupported",
    status: "active",
    runStatus: "running",
    updatedAt: 400,
  },
] as const;

function renderActivity() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return renderHook(() => useAgentActivity(), { wrapper });
}

describe("useAgentActivity", () => {
  beforeEach(() => {
    mocks.permissions.mockReset();
    mocks.questions.mockReset();
    mocks.useModels.mockReturnValue({
      data: [
        { id: "agent", capabilities: { approvals: true, questions: true } },
        { id: "basic", capabilities: { approvals: false, questions: false } },
      ],
    });
    mocks.useRecentSessions.mockReturnValue({
      data: sessions,
      isLoading: false,
    });
    mocks.useWorkspaces.mockReturnValue({ data: [] });
    mocks.questions.mockImplementation(async (sessionId: string) =>
      Response.json(
        sessionId === "question"
          ? [{ id: "question-request", sessionId, questions: [] }]
          : [],
      ),
    );
    mocks.permissions.mockImplementation(async (sessionId: string) =>
      Response.json(
        sessionId === "permission"
          ? [
              {
                id: "permission-request",
                sessionId,
                permission: "read",
                patterns: [],
                always: [],
              },
            ]
          : [],
      ),
    );
  });

  test("prioritizes waiting sessions and derives activity counts", async () => {
    const { result } = renderActivity();

    await waitFor(() => expect(result.current.waitingCount).toBe(2));

    expect(result.current).toMatchObject({
      activityState: "wait-for-human",
      waitingCount: 2,
      workingCount: 1,
      records: [
        {
          session: { id: "question" },
          state: "wait-for-human",
          reason: "question",
        },
        {
          session: { id: "permission" },
          state: "wait-for-human",
          reason: "permission",
        },
        { session: { id: "working" }, state: "working" },
      ],
    });
  });

  test("does not poll sessions whose provider cannot request human input", async () => {
    const { result } = renderActivity();

    await waitFor(() => expect(result.current.records).toHaveLength(3));

    expect(mocks.questions).toHaveBeenCalledTimes(3);
    expect(mocks.permissions).toHaveBeenCalledTimes(3);
    expect(mocks.questions).not.toHaveBeenCalledWith("unsupported");
    expect(mocks.permissions).not.toHaveBeenCalledWith("unsupported");
  });

  test("returns idle state and zero counts when there is no agent activity", async () => {
    mocks.useRecentSessions.mockReturnValue({ data: [], isLoading: false });

    const { result } = renderActivity();

    await waitFor(() => expect(result.current.activityState).toBe("idle"));
    expect(result.current).toMatchObject({
      waitingCount: 0,
      workingCount: 0,
      records: [],
    });
  });
});
