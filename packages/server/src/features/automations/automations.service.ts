import { randomUUID } from "node:crypto";
import { access } from "node:fs/promises";
import cron from "node-cron";
import type { AutomationRecord, AutomationRunRecord } from "../../db/schema";
import type { AgentProviderRegistry } from "../../providers";
import { NotFoundError, ValidationError } from "../../shared/domain-error";
import type { WorkspacesService } from "../workspaces/workspaces.service";
import type { SessionsService } from "../sessions/sessions.service";
import type { AutomationsRepository } from "./automations.repository";
import type {
  AutomationInput,
  AutomationUpdateInput,
} from "./automations.model";

const leaseMs = 60_000;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const iso = (value: Date | null) => value?.toISOString() ?? null;
const runDto = (run: AutomationRunRecord) => ({
  ...run,
  scheduledFor: iso(run.scheduledFor),
  createdAt: run.createdAt.toISOString(),
  startedAt: iso(run.startedAt),
  finishedAt: iso(run.finishedAt),
});
const automationDto = (value: AutomationRecord) => ({
  ...value,
  createdAt: value.createdAt.toISOString(),
  updatedAt: value.updatedAt.toISOString(),
});

export function createAutomationsService(
  repository: AutomationsRepository,
  registry: AgentProviderRegistry,
  sessions: SessionsService,
  workspaces: WorkspacesService,
) {
  const get = (id: string) => {
    const automation = repository.findById(id);
    if (!automation) throw new NotFoundError(`Automation ${id} not found`);
    return automation;
  };
  const validate = async (
    input: AutomationInput | AutomationUpdateInput,
    prior?: AutomationRecord,
  ) => {
    const directoryMode = input.directoryMode ?? prior?.directoryMode;
    const directoryPath = input.directoryPath ?? prior?.directoryPath;
    if (directoryMode === "specified") {
      if (!directoryPath)
        throw new ValidationError("A directory path is required");
      try {
        await access(directoryPath);
      } catch {
        throw new ValidationError(`Directory does not exist: ${directoryPath}`);
      }
    }
    const providerId = input.providerInstanceId ?? prior?.providerInstanceId;
    if (providerId) {
      const provider = registry.get(providerId);
      if (
        !provider.createSession ||
        !provider.getSession ||
        !provider.sendMessage ||
        !provider.getSessionStatuses ||
        !provider.listMessages ||
        !provider.abortSession
      )
        throw new ValidationError(
          `Provider ${providerId} does not support automation runs`,
        );
      // TODO: Revisit how automation runs handle providers that need interactive input.
    }
    const schedule = input.schedule ?? prior?.schedule;
    if (schedule && !cron.validate(schedule.cron))
      throw new ValidationError("Invalid cron expression");
  };
  const create = async (input: AutomationInput) => {
    await validate(input);
    return automationDto(repository.create({ id: randomUUID(), ...input }));
  };
  const list = () => repository.list().map(automationDto);
  const update = async (id: string, input: AutomationUpdateInput) => {
    const existing = get(id);
    await validate(input, existing);
    const updated = repository.update(id, input);
    if (!updated) throw new NotFoundError(`Automation ${id} not found`);
    return automationDto(updated);
  };
  const remove = (id: string) => {
    get(id);
    repository.delete(id);
  };
  const listRuns = (id: string) => {
    get(id);
    return repository.listRuns(id).map(runDto);
  };
  const getRun = (id: string, runId: string) => {
    const run = repository.findRunById(id, runId);
    if (!run) throw new NotFoundError(`Run ${runId} not found`);
    return runDto(run);
  };
  const cancellation = new Map<string, () => void>();
  const ownedRuns = new Map<string, string>();

  const validateRunConfiguration = async (automation: AutomationRecord) => {
    await validate({
      name: automation.name,
      prompt: automation.prompt,
      providerInstanceId: automation.providerInstanceId,
      directoryMode: automation.directoryMode,
      ...(automation.agentId && { agentId: automation.agentId }),
      ...(automation.model && { model: automation.model }),
      ...(automation.directoryPath && {
        directoryPath: automation.directoryPath,
      }),
      ...(automation.schedule && { schedule: automation.schedule }),
    });
    const selectedProvider = await registry
      .get(automation.providerInstanceId)
      .getInfo();
    if (
      automation.model &&
      !selectedProvider.models?.some(
        (model) =>
          model.providerId === automation.model?.providerId &&
          model.modelId === automation.model?.modelId,
      )
    ) {
      throw new Error("Selected provider/model is no longer available");
    }
  };

  const createRunSession = async (
    run: AutomationRunRecord,
    automation: AutomationRecord,
  ) => {
    const directory =
      automation.directoryMode === "specified"
        ? automation.directoryPath!
        : (await workspaces.createTemp()).directory;
    return sessions.create({
      providerId: automation.providerInstanceId,
      directory,
      title: automation.name,
      agentId: automation.agentId ?? undefined,
      model: automation.model ?? undefined,
      metadata: { origin: { type: "automation_run", runId: run.id } },
    });
  };

  const waitForRunOutput = async (
    sessionId: string,
    isStopped: () => boolean,
  ) => {
    let finalOutput = "";
    const timeoutAt = Date.now() + 30 * 60_000;
    while (Date.now() < timeoutAt) {
      if (isStopped()) return;
      const status = await sessions.status(sessionId);
      if (await sessions.hasPendingInteractions(sessionId)) {
        throw new Error("Provider run is waiting for interactive input");
      }
      const page = await sessions.messages(sessionId, { limit: 100 });
      const assistant = page.messages
        .filter((message) => message.role === "assistant")
        .at(-1);
      finalOutput =
        assistant?.parts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("")
          .trim() ?? "";
      if (status === "failed") throw new Error("Provider run failed");
      if ((status === "idle" || status === "completed") && finalOutput) break;
      await delay(500);
    }
    if (!finalOutput)
      throw new Error("Provider run timed out or produced no final answer");
    return finalOutput;
  };

  const start = async (
    id: string,
    trigger: "manual" | "schedule" = "manual",
    scheduledFor?: Date,
  ) => {
    const automation = get(id);
    const runId = randomUUID();
    const ownerId = randomUUID();
    const configSnapshot = {
      ...automation,
      createdAt: automation.createdAt.toISOString(),
      updatedAt: automation.updatedAt.toISOString(),
    };
    const claim = repository.claimRun({
      id: runId,
      automationId: id,
      trigger,
      scheduledFor,
      configSnapshot,
      ownerId,
      leaseExpiresAt: new Date(Date.now() + leaseMs),
    });
    if (!claim.claimed) return runDto(claim.run);
    ownedRuns.set(runId, id);
    void execute(claim.run, automation, ownerId);
    return runDto(claim.run);
  };

  const execute = async (
    run: AutomationRunRecord,
    automation: AutomationRecord,
    ownerId: string,
  ) => {
    let sessionId: string | undefined;
    let stopped = false;
    cancellation.set(run.id, () => {
      stopped = true;
    });
    const heartbeat = setInterval(
      () =>
        repository.renewLease(run.id, ownerId, new Date(Date.now() + leaseMs)),
      leaseMs / 3,
    );
    try {
      await validateRunConfiguration(automation);
      if (stopped) return;
      const started = repository.transitionRun(run.id, ownerId, "running", {
        phase: "working",
        leaseExpiresAt: new Date(Date.now() + leaseMs),
      });
      if (!started) return;
      const session = await createRunSession(run, automation);
      sessionId = session.id;
      const sessionStored = repository.transitionRun(
        run.id,
        ownerId,
        "running",
        {
          sessionId,
          phase: "working",
          leaseExpiresAt: new Date(Date.now() + leaseMs),
        },
      );
      if (!sessionStored || stopped) return;
      await sessions.automationSendMessage(session.id, {
        content: automation.prompt,
        model: automation.model ?? undefined,
        agentId: automation.agentId ?? undefined,
      });
      const finalOutput = await waitForRunOutput(session.id, () => stopped);
      if (stopped) return;
      if (!finalOutput)
        throw new Error("Provider run timed out or produced no final answer");
      repository.transitionRun(run.id, ownerId, "running", {
        phase: "send_to_log",
        output: finalOutput,
        leaseExpiresAt: new Date(Date.now() + leaseMs),
      });
      repository.transitionRun(run.id, ownerId, "succeeded", {
        output: finalOutput,
      });
    } catch (error) {
      repository.transitionRun(run.id, ownerId, "failed", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      cancellation.delete(run.id);
      ownedRuns.delete(run.id);
      clearInterval(heartbeat);
    }
  };

  const stop = async (id: string, runId: string) => {
    const run = repository.findRunById(id, runId);
    if (!run) throw new NotFoundError(`Run ${runId} not found`);
    if (!["pending", "running"].includes(run.state) || !run.ownerId)
      return runDto(run);
    if (run.sessionId) await sessions.automationAbort(run.sessionId);
    cancellation.get(run.id)?.();
    const updated = repository.transitionRun(
      run.id,
      run.ownerId,
      "interrupted",
      { reason: "Stopped by user" },
    );
    return runDto(updated ?? repository.findRunById(id, runId) ?? run);
  };

  const recoverExpired = (now = new Date()) => {
    const reclaimed = repository.reclaimExpiredRuns(
      now,
      randomUUID(),
      new Date(now.getTime() + leaseMs),
    );
    for (const run of reclaimed) {
      const automation = repository.findById(run.automationId);
      if (automation && run.ownerId) void execute(run, automation, run.ownerId);
    }
    return reclaimed;
  };
  const stopOwnedRuns = async () => {
    for (const [runId, automationId] of ownedRuns) {
      await stop(automationId, runId);
    }
  };
  return {
    create,
    list,
    get: (id: string) => automationDto(get(id)),
    update,
    delete: remove,
    listRuns,
    getRun,
    start,
    stop,
    recoverExpired,
    stopOwnedRuns,
  };
}

export type AutomationsService = ReturnType<typeof createAutomationsService>;
