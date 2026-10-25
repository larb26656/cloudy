import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AutomationRecord, AutomationRunRecord } from "../../db/schema";
import { NotFoundError, ValidationError } from "../../shared/domain-error";
import { createAutomationsService } from "./automations.service";

const now = new Date("2025-01-01T00:00:00.000Z");
const automation = (
  overrides: Partial<AutomationRecord> = {},
): AutomationRecord => ({
  id: "automation-1",
  name: "Daily",
  prompt: "Do work",
  providerInstanceId: "test",
  agentId: null,
  model: null,
  directoryMode: "temp",
  directoryPath: null,
  schedule: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});
const run = (
  overrides: Partial<AutomationRunRecord> = {},
): AutomationRunRecord => ({
  id: "run-1",
  automationId: "automation-1",
  trigger: "manual",
  scheduledFor: null,
  state: "pending",
  phase: null,
  sessionId: null,
  output: null,
  error: null,
  reason: null,
  configSnapshot: {},
  ownerId: "owner-1",
  leaseExpiresAt: new Date(now.getTime() + 60_000),
  createdAt: now,
  startedAt: null,
  finishedAt: null,
  ...overrides,
});

const makeHarness = () => {
  const repository = {
    create: vi.fn((input) => automation(input)),
    findById: vi.fn((id: string) =>
      id === "automation-1" ? automation() : null,
    ),
    list: vi.fn(() => [automation()]),
    update: vi.fn((_id, input) => automation(input)),
    delete: vi.fn(),
    listRuns: vi.fn(() => [run()]),
    findRunById: vi.fn((automationId: string, runId: string) =>
      automationId === "automation-1" && runId === "run-1" ? run() : null,
    ),
    claimRun: vi.fn((input) => ({
      claimed: true,
      run: run({
        id: input.id,
        automationId: input.automationId,
        trigger: input.trigger,
        scheduledFor: input.scheduledFor ?? null,
        configSnapshot: input.configSnapshot,
        ownerId: input.ownerId,
      }),
    })),
    transitionRun: vi.fn((id, _owner, state, input = {}) =>
      run({ id, state, ...input }),
    ),
    reclaimExpiredRuns: vi.fn(() => [] as AutomationRunRecord[]),
    renewLease: vi.fn(() => true),
  };
  const provider = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    sendMessage: vi.fn(),
    getSessionStatuses: vi.fn(),
    listMessages: vi.fn(),
    abortSession: vi.fn(),
    getInfo: vi.fn(async () => ({
      id: "test",
      name: "Test",
      capabilities: { approvals: false, questions: false },
      models: [],
    })),
  };
  const sessions = {
    create: vi.fn(async () => ({ id: "session-1" })),
    automationSendMessage: vi.fn(async () => undefined),
    status: vi.fn(async () => "completed"),
    hasPendingInteractions: vi.fn(async () => false),
    messages: vi.fn(async () => ({
      messages: [
        {
          role: "assistant",
          parts: [{ type: "text", text: " Finished successfully " }],
        },
      ],
    })),
    automationAbort: vi.fn(async () => undefined),
  };
  const workspaces = {
    createTemp: vi.fn(async () => ({ directory: "/tmp/automation" })),
  };
  const service = createAutomationsService(
    repository as never,
    { get: () => provider } as never,
    sessions as never,
    workspaces as never,
  );
  return { service, repository, provider, sessions, workspaces };
};

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("automations service", () => {
  it("creates and lists definitions as ISO date DTOs", async () => {
    const { service, repository } = makeHarness();
    const input = {
      name: "Daily",
      prompt: "Do work",
      providerInstanceId: "test",
      directoryMode: "temp" as const,
    };
    const created = await service.create(input);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining(input),
    );
    expect(created).toMatchObject({
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(created.id).toEqual(expect.any(String));
    expect(service.list()[0]).toMatchObject({
      id: "automation-1",
      createdAt: now.toISOString(),
    });
  });

  it("rejects invalid directory, cron, and unsupported provider", async () => {
    const { service, repository, provider } = makeHarness();
    const input = {
      name: "A",
      prompt: "B",
      providerInstanceId: "test",
      directoryMode: "temp" as const,
    };
    await expect(
      service.create({
        ...input,
        directoryMode: "specified",
        directoryPath: "/missing",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({
        ...input,
        schedule: { cron: "nope", timezone: "UTC", enabled: true },
      }),
    ).rejects.toMatchObject({ message: "Invalid cron expression" });
    const missingOperations = { ...provider, abortSession: undefined };
    const unsupported = createAutomationsService(
      repository as never,
      { get: () => missingOperations } as never,
      {} as never,
      {} as never,
    );
    await expect(unsupported.create(input)).rejects.toMatchObject({
      message: "Provider test does not support automation runs",
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("accepts an existing specified directory and rejects a missing one", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "cloudy-automation-"));
    tempDirs.push(dir);
    const { service, repository } = makeHarness();
    const input = {
      name: "A",
      prompt: "B",
      providerInstanceId: "test",
      directoryMode: "specified" as const,
      directoryPath: dir,
    };
    await service.create(input);
    expect(repository.create).toHaveBeenCalledOnce();
    await expect(
      service.create({ ...input, directoryPath: `${dir}/missing` }),
    ).rejects.toMatchObject({
      message: `Directory does not exist: ${dir}/missing`,
    });
  });

  it("updates, deletes, and reports missing definitions", async () => {
    const { service, repository } = makeHarness();
    expect(
      await service.update("automation-1", { name: "Updated" }),
    ).toMatchObject({ name: "Updated" });
    expect(repository.update).toHaveBeenCalledWith("automation-1", {
      name: "Updated",
    });
    expect(() => service.get("missing")).toThrow(NotFoundError);
    await expect(
      service.update("missing", { name: "Updated" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(() => service.delete("missing")).toThrow(NotFoundError);
    service.delete("automation-1");
    expect(repository.delete).toHaveBeenCalledWith("automation-1");
    repository.update.mockReturnValueOnce(null as never);
    await expect(
      service.update("automation-1", { name: "Updated" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists runs, serializes date fields, and looks up a run", () => {
    const { service, repository } = makeHarness();
    const actual = run({ scheduledFor: now, startedAt: now, finishedAt: now });
    repository.listRuns.mockReturnValue([actual]);
    repository.findRunById.mockReturnValue(actual);
    expect(service.listRuns("automation-1")[0]).toMatchObject({
      scheduledFor: now.toISOString(),
      createdAt: now.toISOString(),
      startedAt: now.toISOString(),
      finishedAt: now.toISOString(),
    });
    expect(service.getRun("automation-1", "run-1").id).toBe("run-1");
    expect(repository.findRunById).toHaveBeenCalledWith(
      "automation-1",
      "run-1",
    );
    expect(() => service.listRuns("missing")).toThrow(NotFoundError);
    repository.findRunById.mockReturnValueOnce(null);
    expect(() => service.getRun("automation-1", "missing")).toThrow(
      NotFoundError,
    );
  });

  it("claims and executes a run through the successful session lifecycle", async () => {
    const { service, repository, sessions, workspaces } = makeHarness();
    const started = await service.start("automation-1", "schedule", now);
    expect(started).toMatchObject({
      state: "pending",
      scheduledFor: now.toISOString(),
    });
    expect(repository.claimRun).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: "schedule", scheduledFor: now }),
    );
    await vi.waitFor(() =>
      expect(repository.transitionRun).toHaveBeenCalledWith(
        started.id,
        expect.any(String),
        "succeeded",
        { output: "Finished successfully" },
      ),
    );
    expect(workspaces.createTemp).toHaveBeenCalledOnce();
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "test",
        directory: "/tmp/automation",
        title: "Daily",
      }),
    );
    expect(sessions.automationSendMessage).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ content: "Do work" }),
    );
  });

  it("does not execute a duplicate claim", async () => {
    const { service, repository, sessions } = makeHarness();
    repository.claimRun.mockReturnValueOnce({
      claimed: false,
      run: run({ state: "skipped", ownerId: null }),
    });
    expect(await service.start("automation-1")).toMatchObject({
      state: "skipped",
    });
    await Promise.resolve();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it("stops active runs and returns terminal runs unchanged", async () => {
    const { service, repository, sessions } = makeHarness();
    repository.findRunById.mockReturnValue(run({ sessionId: "session-1" }));
    expect(await service.stop("automation-1", "run-1")).toMatchObject({
      state: "interrupted",
    });
    expect(sessions.automationAbort).toHaveBeenCalledWith("session-1");
    repository.findRunById.mockReturnValue(
      run({ state: "succeeded", ownerId: null }),
    );
    expect(await service.stop("automation-1", "run-1")).toMatchObject({
      state: "succeeded",
    });
    repository.findRunById.mockReturnValueOnce(null);
    await expect(
      service.stop("automation-1", "missing"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("recovers expired runs only when their automation still exists", () => {
    const { service, repository } = makeHarness();
    repository.reclaimExpiredRuns.mockReturnValue([
      run(),
      run({ id: "run-2", automationId: "missing" }),
    ]);
    expect(service.recoverExpired(now)).toHaveLength(2);
    expect(repository.reclaimExpiredRuns).toHaveBeenCalledWith(
      now,
      expect.any(String),
      new Date(now.getTime() + 60_000),
    );
  });

  it("marks runs failed when provider models disappear or the provider fails", async () => {
    const { service, repository, provider, sessions } = makeHarness();
    repository.findById.mockReturnValue(
      automation({ model: { providerId: "vendor", modelId: "gone" } }),
    );
    await service.start("automation-1");
    const firstRunId = repository.claimRun.mock.results[0]?.value.run.id;
    await vi.waitFor(() =>
      expect(repository.transitionRun).toHaveBeenCalledWith(
        firstRunId,
        expect.any(String),
        "failed",
        expect.objectContaining({
          error: "Selected provider/model is no longer available",
        }),
      ),
    );
    repository.findById.mockReturnValue(automation());
    repository.transitionRun.mockClear();
    provider.getInfo.mockResolvedValue({
      id: "test",
      name: "Test",
      capabilities: { approvals: false, questions: false },
      models: [],
    });
    sessions.status.mockResolvedValue("failed");
    await service.start("automation-1");
    const secondRunId = repository.claimRun.mock.results[1]?.value.run.id;
    await vi.waitFor(() =>
      expect(repository.transitionRun).toHaveBeenCalledWith(
        secondRunId,
        expect.any(String),
        "failed",
        expect.objectContaining({
          error: "Provider run failed",
          sessionId: "session-1",
        }),
      ),
    );
  });
});
