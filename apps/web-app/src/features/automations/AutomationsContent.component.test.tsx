import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AutomationsContent } from "./AutomationsContent";

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  stop: vi.fn(),
  addTab: vi.fn(),
  setReturnTarget: vi.fn(),
}));

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: () => ({
    data: [
      {
        id: "provider-one",
        name: "Provider One",
        capabilities: {
          agents: true,
          models: true,
          requiresDirectory: true,
          approvals: false,
          questions: false,
        },
        agents: [{ id: "agent-one", name: "Agent One" }],
        models: [
          {
            providerId: "model-provider",
            modelId: "model-one",
            name: "Model One",
          },
        ],
      },
    ],
  }),
}));

vi.mock("@/hooks/queries/useAgents", () => ({
  useAgents: () => ({ data: [{ id: "agent-one", name: "Agent One" }] }),
}));

vi.mock("@/hooks/queries/useAutomations", () => ({
  useAutomations: () => ({
    data: [
      {
        id: "auto-one",
        name: "Daily review",
        prompt: "Review the project",
        providerInstanceId: "provider-one",
        directoryMode: "temp",
        directoryPath: null,
        agentId: null,
        model: null,
        schedule: {
          cron: "0 9 * * 1-5",
          timezone: "Asia/Bangkok",
          enabled: true,
        },
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ],
    isLoading: false,
  }),
  useAutomationRuns: () => ({
    data: [
      {
        id: "run-one",
        automationId: "auto-one",
        trigger: "schedule",
        scheduledFor: null,
        state: "skipped",
        phase: null,
        sessionId: null,
        output: null,
        error: null,
        reason: "overlap",
        configSnapshot: {},
        createdAt: "2026-01-01",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "run-four",
        automationId: "auto-one",
        trigger: "manual",
        scheduledFor: null,
        state: "succeeded",
        phase: null,
        sessionId: "session-four",
        output: "Completed report",
        error: null,
        reason: null,
        configSnapshot: {
          providerInstanceId: "provider-one",
          directoryMode: "specified",
          directoryPath: "/project",
        },
        createdAt: "2026-01-04",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "run-two",
        automationId: "auto-one",
        trigger: "manual",
        scheduledFor: null,
        state: "failed",
        phase: null,
        sessionId: null,
        output: null,
        error: "Provider unavailable",
        reason: null,
        configSnapshot: {},
        createdAt: "2026-01-02",
        startedAt: null,
        finishedAt: null,
      },
      {
        id: "run-three",
        automationId: "auto-one",
        trigger: "manual",
        scheduledFor: null,
        state: "interrupted",
        phase: null,
        sessionId: null,
        output: null,
        error: null,
        reason: "Stopped by user",
        configSnapshot: {},
        createdAt: "2026-01-03",
        startedAt: null,
        finishedAt: null,
      },
    ],
  }),
  useSchedulePreview: () => ({
    data: {
      occurrences: [
        "2026-01-02T09:00:00.000Z",
        "2026-01-03T09:00:00.000Z",
        "2026-01-04T09:00:00.000Z",
      ],
    },
  }),
  useCreateAutomation: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateAutomation: () => ({ mutate: mocks.update, isPending: false }),
  useDeleteAutomation: () => ({ mutate: mocks.remove }),
  useRunAutomation: () => ({ mutate: mocks.run }),
  useStopAutomationRun: () => ({ mutate: mocks.stop }),
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: (
    selector: (state: { addTab: typeof mocks.addTab }) => unknown,
  ) => selector({ addTab: mocks.addTab }),
}));

vi.mock("@/stores/automationNavigationStore", () => ({
  useAutomationNavigationStore: (
    selector: (state: {
      consumeReturnTarget: () => null;
      setReturnTarget: typeof mocks.setReturnTarget;
    }) => unknown,
  ) =>
    selector({
      consumeReturnTarget: () => null,
      setReturnTarget: mocks.setReturnTarget,
    }),
}));

describe("AutomationsContent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires name, prompt and provider before save and shows capability-aware selections", async () => {
    const user = userEvent.setup();
    render(<AutomationsContent />);
    fireEvent.click(screen.getByRole("button", { name: "New automation" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save automation" }),
      ).toBeDisabled(),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Nightly" },
    });
    fireEvent.change(screen.getByLabelText("Prompt"), {
      target: { value: "Inspect changes" },
    });
    fireEvent.click(
      screen.getByRole("combobox", { name: "Provider instance" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Provider One" }));
    expect(screen.getByText("Default Agent")).toBeInTheDocument();
    expect(screen.getByLabelText("Model")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Schedule" }));
    await user.click(
      await screen.findByRole("option", { name: "Set a schedule" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Minute" }), {
      target: { value: "not cron" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid cron expression",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save automation" }),
      ).toBeDisabled(),
    );
  });

  it("shows saved schedule preview and trigger source/reason, and runs manually", () => {
    render(<AutomationsContent />);
    fireEvent.click(screen.getByRole("button", { name: /Daily review/ }));
    expect(screen.getAllByText("schedule")).toHaveLength(1);
    expect(screen.getByText("overlap")).toBeInTheDocument();
    expect(screen.getByText("Provider unavailable")).toBeInTheDocument();
    expect(screen.getByText("Stopped by user")).toBeInTheDocument();
    expect(screen.getAllByText("manual")).toHaveLength(3);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Run now" }));
    expect(mocks.run).toHaveBeenCalledWith("auto-one");
    expect(screen.getByText("Completed report")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open session" }));
    expect(mocks.addTab).toHaveBeenCalledWith(
      "chat",
      expect.objectContaining({
        sessionId: "session-four",
        directory: "/project",
      }),
    );
    expect(mocks.setReturnTarget).toHaveBeenCalledWith({
      automationId: "auto-one",
      runId: "run-four",
    });
  });

  it("confirms automation deletion from the item actions menu", async () => {
    const user = userEvent.setup();
    render(<AutomationsContent />);

    await user.click(
      screen.getByRole("button", { name: "Automation item actions" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      'Delete "Daily review" permanently?',
    );

    await user.click(screen.getByRole("button", { name: "Delete automation" }));

    expect(mocks.remove).toHaveBeenCalledWith("auto-one", expect.any(Object));
  });
});
