import { spawn } from "node:child_process";
import { isAbsolute } from "node:path";
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import {
  createAcpMessageState,
  finishPrompt,
  mapSessionUpdate,
  startPrompt,
} from "./acp.message-mapper";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../shared/domain-error";
import type { ChildProcess, SpawnOptions } from "node:child_process";
import type {
  AgentProviderAdapter,
  AgentProviderInfo,
  ChatEvent,
  ChatSession,
  InteractionResponse,
  InteractionResponseInput,
  ModelInfo,
  PermissionRequest,
  ProviderEventsInput,
  ProviderMessageRequest,
  ProviderSessionInput,
} from "@repo/ai-core";
import type { AcpMessageState, MessageChange } from "./acp.message-mapper";

export interface AcpLaunchSpec {
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
}

export interface AcpAdapterOptions {
  id: string;
  name: string;
  launch: AcpLaunchSpec;
  catalogDirectory?: string;
  catalogLaunch?: AcpLaunchSpec;
  timeoutMs?: number;
  spawn?: (
    command: string,
    args: string[],
    options: SpawnOptions,
  ) => ChildProcess;
}

export interface AcpAdapter extends AgentProviderAdapter {
  createSession(input: ProviderSessionInput): Promise<ChatSession>;
  sendMessage(request: ProviderMessageRequest): Promise<InteractionResponse>;
  abortSession(input: { sessionId: string }): Promise<void>;
  deleteSession(input: { sessionId: string }): Promise<void>;
  respondToInteraction(
    response: InteractionResponseInput,
  ): Promise<InteractionResponse>;
}

interface PendingPermission {
  request: PermissionRequest;
  params: acp.RequestPermissionRequest;
  resolve: (response: acp.RequestPermissionResponse) => void;
}

interface AcpSession {
  id: string;
  directory: string;
  process: ChildProcess;
  connection: acp.ClientConnection;
  capabilities: acp.AgentCapabilities | undefined;
  model?: Extract<acp.SessionConfigOption, { type: "select" }>;
  turn?: Promise<void>;
  messageState: AcpMessageState;
  replaying: boolean;
  loadingMessages?: Promise<void>;
  historyUnavailable: boolean;
  pendingChanges?: MessageChange[];
  prompting: boolean;
  pendingPermissions: Map<string, PendingPermission>;
  closed: boolean;
}

interface Subscriber {
  input: ProviderEventsInput;
  values: ChatEvent[];
  pending: Array<(result: IteratorResult<ChatEvent>) => void>;
  closed: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function createAcpAdapter({
  id,
  name,
  launch,
  catalogDirectory,
  catalogLaunch = launch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  spawn: spawnProcess = spawn,
}: AcpAdapterOptions): AcpAdapter {
  const sessions = new Map<string, AcpSession>();
  const creatingSessions = new Map<string, Promise<ChatSession>>();
  const subscribers = new Set<Subscriber>();
  const models = new Map<string, ModelInfo>();
  let catalogProbe: Promise<void> | undefined;
  let catalogProbed = false;

  const publish = (event: ChatEvent) => {
    for (const subscriber of subscribers) {
      if (subscriber.closed || !matches(subscriber.input, event)) continue;
      const resolve = subscriber.pending.shift();
      if (resolve) resolve({ done: false, value: event });
      else subscriber.values.push(event);
    }
  };

  const publishChanges = (session: AcpSession, changes: MessageChange[]) => {
    for (const change of changes) {
      const context = {
        providerId: id,
        directory: session.directory,
        sessionId: session.id,
      };
      switch (change.type) {
        case "message":
          publish({
            type: "message.updated",
            ...context,
            message: change.message,
          });
          break;
        case "part":
          publish({
            type: "message.part.updated",
            ...context,
            messageId: change.messageId,
            part: change.part,
          });
          break;
      }
    }
  };

  const replayMessages = async (session: AcpSession) => {
    const previous = session.messageState;
    session.messageState = createAcpMessageState(session.id);
    session.replaying = true;
    try {
      const loaded = await withTimeout(
        session.connection.agent.request(acp.methods.agent.session.load, {
          sessionId: session.id,
          cwd: session.directory,
          mcpServers: [],
        }),
        timeoutMs,
        "ACP session load timed out",
      );
      if (loaded.configOptions) updateModel(session, loaded.configOptions);
    } catch (error) {
      session.messageState = previous;
      throw error;
    } finally {
      session.replaying = false;
    }
  };

  const loadMessages = (session: AcpSession) => {
    session.loadingMessages ??= replayMessages(session).finally(() => {
      session.loadingMessages = undefined;
    });
    return session.loadingMessages;
  };

  const closeSession = (session: AcpSession, error?: unknown) => {
    if (session.closed) return;
    session.closed = true;
    sessions.delete(session.id);
    for (const pending of session.pendingPermissions.values())
      pending.resolve({ outcome: { outcome: "cancelled" } });
    session.pendingPermissions.clear();
    session.connection.close(error);
    session.process.stdin?.destroy();
    session.process.stdout?.destroy();
    if (!session.process.killed) session.process.kill();
  };

  const updateModel = (
    session: AcpSession,
    options: acp.SessionConfigOption[],
  ) => {
    const model = options.find(
      (option) => option.type === "select" && option.category === "model",
    ) ?? options.find(
      (option) =>
        option.type === "select" &&
        option.id === (session.model?.id ?? "model"),
    );
    session.model = model?.type === "select" ? model : undefined;
  };

  const offersModel = (
    model: AcpSession["model"],
    modelId: string,
  ): model is NonNullable<AcpSession["model"]> =>
    model !== undefined &&
    model.options.some((item) =>
      "options" in item
        ? item.options.some((option) => option.value === modelId)
        : item.value === modelId,
    );

  const applyModel = async (session: AcpSession, modelId?: string) => {
    if (!modelId)
      throw new ValidationError("Select a model before sending your message.");
    const model = session.model;
    if (!offersModel(model, modelId))
      throw new ValidationError(
        `Model "${modelId}" is not available in this ACP session. Choose an available model.`,
      );
    if (model.currentValue === modelId) return;
    try {
      const result = await withTimeout(
        session.connection.agent.request(acp.methods.agent.session.setConfigOption, {
          sessionId: session.id,
          configId: model.id,
          value: modelId,
        }),
        timeoutMs,
        "ACP model selection timed out",
      );
      updateModel(session, result.configOptions);
    } catch (error) {
      closeSession(session, error);
      throw new ConflictError(
        `The ACP agent could not activate model "${modelId}". Choose another model or check the agent configuration.`,
      );
    }
    if (session.model?.currentValue !== modelId || !offersModel(session.model, modelId))
      throw new ConflictError(
        `The ACP agent did not confirm model "${modelId}". Choose another model or check the agent configuration.`,
      );
  };

  const adapter = {
    id,
    capabilities: {
      streaming: true,
      requiresDirectory: true,
      approvals: true,
      agents: true,
      tools: true,
      reasoning: true,
      models: false,
    },
    async getInfo(input?: {
      refreshModels?: boolean;
    }): Promise<AgentProviderInfo> {
      let modelDiscoveryError: string | undefined;
      if (catalogDirectory && (!catalogProbed || input?.refreshModels)) {
        catalogProbe ??= (async () => {
          let sessionId: string | undefined;
          const probeAdapter = createAcpAdapter({
            id,
            name,
            launch: catalogLaunch,
            timeoutMs,
            spawn: spawnProcess,
          });
          try {
            const session = await probeAdapter.createSession({
              directory: catalogDirectory,
            });
            sessionId = session.id;
            const probeInfo = await probeAdapter.getInfo();
            models.clear();
            for (const model of probeInfo.models ?? [])
              models.set(model.modelId, model);
            catalogProbed = true;
          } finally {
            if (sessionId) {
              try {
                await probeAdapter.deleteSession({ sessionId });
              } catch (error) {
                console.warn("[ACP] Catalog discovery session cleanup failed", {
                  providerId: id,
                  sessionId,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
          }
        })();
        try {
          await catalogProbe;
        } catch (error) {
          if (input?.refreshModels) throw error;
          modelDiscoveryError =
            error instanceof Error ? error.message : String(error);
        } finally {
          catalogProbe = undefined;
        }
      }
      console.info("[ACP] Building provider catalog", {
        providerId: id,
        agentCount: 1,
        modelCount: models.size,
        modelIds: [...models.keys()],
      });
      return {
        id,
        providerType: "acp",
        name,
        capabilities: { ...adapter.capabilities, models: models.size > 0 },
        agents: [{ id, name, mode: "primary" }],
        ...(models.size > 0 ? { models: [...models.values()] } : {}),
        ...(modelDiscoveryError ? { modelDiscoveryError } : {}),
        metadata: { command: launch.command, args: launch.args },
      };
    },
    async createSession(input: ProviderSessionInput): Promise<ChatSession> {
      const existing = input.sessionId && creatingSessions.get(input.sessionId);
      if (existing) return existing;
      const creation = (async (): Promise<ChatSession> => {
        if (!input.directory || !isAbsolute(input.directory))
          throw new Error("ACP sessions require an absolute directory");

        const child = spawnProcess(launch.command, launch.args, {
          cwd: input.directory,
          env: launch.env ? { ...process.env, ...launch.env } : process.env,
          stdio: ["pipe", "pipe", "pipe"],
        });
        if (!child.stdin || !child.stdout) {
          child.kill();
          throw new Error("ACP agent must expose stdin and stdout");
        }
        child.stderr?.on("data", (chunk: Buffer | string) => {
          console.info("[ACP] Agent stderr", {
            providerId: id,
            output: String(chunk).trimEnd(),
          });
        });

        const sessionId = crypto.randomUUID();
        const pendingPermissions = new Map<string, PendingPermission>();
        const stream = acp.ndJsonStream(
          Writable.toWeb(child.stdin),
          Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
        );
        type WireMessage =
          acp.Stream["readable"] extends ReadableStream<infer T> ? T : never;
        stream.readable = stream.readable.pipeThrough(
          new TransformStream<WireMessage, WireMessage>({
            transform(message, controller) {
              if (
                !("method" in message) ||
                message.method !== acp.methods.client.session.update ||
                "id" in message
              ) {
                controller.enqueue(message);
                return;
              }
              const params = message.params;
              if (
                typeof params !== "object" ||
                params === null ||
                !("sessionId" in params) ||
                typeof params.sessionId !== "string" ||
                !("update" in params) ||
                typeof params.update !== "object" ||
                params.update === null ||
                !("sessionUpdate" in params.update) ||
                typeof params.update.sessionUpdate !== "string"
              ) {
                throw new Error("Invalid ACP session update");
              }
              const session = sessions.get(params.sessionId);
              if (!session) return;
              const update = params.update as acp.SessionUpdate;
              if (update.sessionUpdate === "config_option_update")
                updateModel(session, update.configOptions);
              if (
                update.sessionUpdate === "session_info_update" &&
                update.title != null &&
                !session.replaying
              )
                publish({
                  type: "session.title.updated",
                  providerId: id,
                  directory: session.directory,
                  sessionId: session.id,
                  title: update.title,
                });
              const changes = mapSessionUpdate(
                session.messageState,
                update,
                session.replaying ? "load" : "live",
              );
              if (!session.replaying) {
                if (session.pendingChanges && changes.length > 0) {
                  publishChanges(session, [
                    ...session.pendingChanges,
                    ...changes,
                  ]);
                  session.pendingChanges = undefined;
                } else if (!session.pendingChanges) {
                  publishChanges(session, changes);
                }
              }
            },
          }),
        );
        const client = acp
          .client({ name: "cloudy" })
          .onRequest(
            acp.methods.client.session.requestPermission,
            ({ params }) => {
              if (session.closed)
                return { outcome: { outcome: "cancelled" as const } };
              const interactionId = `${params.sessionId}:${params.toolCall.toolCallId}`;
              const request: PermissionRequest = {
                id: interactionId,
                sessionId: params.sessionId,
                permission:
                  params.toolCall.title ?? params.toolCall.name ?? "Tool call",
                patterns: [],
                metadata: {
                  toolCallId: params.toolCall.toolCallId,
                  options: params.options,
                },
              };
              return new Promise<acp.RequestPermissionResponse>((resolve) => {
                pendingPermissions.set(interactionId, {
                  request,
                  params,
                  resolve,
                });
                publish({
                  type: "approval.requested",
                  providerId: id,
                  directory: session.directory,
                  sessionId: params.sessionId,
                  request,
                });
              });
            },
          );
        const connection = client.connect(stream);
        const session: AcpSession = {
          id: sessionId,
          directory: input.directory,
          process: child,
          connection,
          capabilities: undefined,
          messageState: createAcpMessageState(input.sessionId ?? sessionId),
          replaying: false,
          historyUnavailable: false,
          prompting: false,
          pendingPermissions,
          closed: false,
        };

        const fail = (error: unknown) => closeSession(session, error);
        child.once("error", fail);
        child.once("exit", (code, signal) => {
          fail(
            new Error(
              `ACP agent exited${code === null ? "" : ` with code ${code}`}${signal ? ` (${signal})` : ""}`,
            ),
          );
        });
        connection.closed.then(() => closeSession(session));

        try {
          const initialized = await withTimeout(
            connection.agent.request(acp.methods.agent.initialize, {
              protocolVersion: acp.PROTOCOL_VERSION,
              clientCapabilities: {},
              clientInfo: { name: "cloudy", version: "0.1.0" },
            }),
            timeoutMs,
            "ACP initialization timed out",
          );
          session.capabilities = initialized.agentCapabilities;
          console.info("[ACP] Agent initialized", {
            providerId: id,
            protocolVersion: initialized.protocolVersion,
            agentInfo: initialized.agentInfo,
            capabilities: initialized.agentCapabilities,
          });
          let created:
            | acp.NewSessionResponse
            | acp.LoadSessionResponse
            | acp.ResumeSessionResponse = {};
          if (input.sessionId) {
            session.id = input.sessionId;
            sessions.set(session.id, session);
            session.replaying = true;
            let loaded = false;
            if (session.capabilities?.loadSession) {
              try {
                created = await withTimeout(
                  connection.agent.request(acp.methods.agent.session.load, {
                    sessionId: input.sessionId,
                    cwd: input.directory,
                    mcpServers: [],
                  }),
                  timeoutMs,
                  "ACP session load timed out",
                );
                loaded = true;
              } catch {
                session.messageState = createAcpMessageState(input.sessionId);
              }
            }
            session.historyUnavailable = !loaded;
            if (!loaded && session.capabilities?.sessionCapabilities?.resume) {
              try {
                created = await withTimeout(
                  connection.agent.request(acp.methods.agent.session.resume, {
                    sessionId: input.sessionId,
                    cwd: input.directory,
                    mcpServers: [],
                  }),
                  timeoutMs,
                  "ACP session resume timed out",
                );
              } catch {
                session.messageState = createAcpMessageState(input.sessionId);
              }
            }
          } else {
            created = await withTimeout(
              connection.agent.request(acp.methods.agent.session.new, {
                cwd: input.directory,
                mcpServers: [],
              }),
              timeoutMs,
              "ACP session creation timed out",
            );
          }
          session.replaying = false;
          console.info("[ACP] Session config options received", {
            providerId: id,
            sessionId: session.id,
            configOptions: (created.configOptions ?? []).map((option) => ({
              id: option.id,
              name: option.name,
              category: option.category,
              type: option.type,
              values:
                option.type === "select"
                  ? option.options.flatMap((item) =>
                      "options" in item
                        ? item.options.map(({ value, name }) => ({
                            value,
                            name,
                          }))
                        : [{ value: item.value, name: item.name }],
                    )
                  : undefined,
            })),
          });
          for (const option of catalogDirectory
            ? []
            : (created.configOptions ?? [])) {
            if (option.category !== "model" || option.type !== "select")
              continue;
            for (const item of option.options) {
              const values = "options" in item ? item.options : [item];
              for (const model of values) {
                models.set(model.value, {
                  providerId: id,
                  modelId: model.value,
                  name: model.name,
                });
              }
            }
          }
          session.id =
            input.sessionId ??
            ("sessionId" in created ? created.sessionId : session.id);
          session.messageState.sessionId = session.id;
          if (created.configOptions) updateModel(session, created.configOptions);
          sessions.set(session.id, session);
          const now = new Date().toISOString();
          return {
            id: session.id,
            title: input.title,
            status: "idle",
            runStatus: "idle",
            providerId: id,
            createdAt: now,
            updatedAt: now,
            directory: input.directory,
          };
        } catch (error) {
          closeSession(session, error);
          throw error;
        }
      })();
      if (input.sessionId) creatingSessions.set(input.sessionId, creation);
      try {
        return await creation;
      } finally {
        if (input.sessionId) creatingSessions.delete(input.sessionId);
      }
    },
    async sendMessage(request: ProviderMessageRequest) {
      const creating = creatingSessions.get(request.sessionId);
      if (creating) await creating;
      let session = sessions.get(request.sessionId);
      if (!session || session.closed) {
        await adapter.createSession({
          sessionId: request.sessionId,
          directory: request.directory,
        });
        session = getSession(sessions, request.sessionId);
      }
      const previousTurn = session.turn;
      let releaseTurn!: () => void;
      const turn = new Promise<void>((resolve) => {
        releaseTurn = resolve;
      });
      session.turn = turn;
      if (previousTurn) await previousTurn;
      try {
        if (session.closed)
          throw new ConflictError("The ACP session was closed. Retry your message.");
        session.prompting = true;
        if (session.loadingMessages) await session.loadingMessages;
        if (request.attachments?.length)
          throw new Error("ACP attachments are not supported");
        await applyModel(session, request.model?.modelId);
        if (session.historyUnavailable) session.pendingChanges = [];
        const initialChanges = startPrompt(session.messageState, request.content);
        if (session.pendingChanges)
          session.pendingChanges.push(...initialChanges);
        else publishChanges(session, initialChanges);
        publish({
          type: "session.status",
          providerId: id,
          directory: session.directory,
          sessionId: session.id,
          status: "active",
          runStatus: "running",
        });
        try {
          const response = await session.connection.agent.request(
            acp.methods.agent.session.prompt,
            {
              sessionId: session.id,
              prompt: [{ type: "text", text: request.content }],
            },
          );
          const finalChanges = finishPrompt(
            session.messageState,
            response,
            session.model?.currentValue,
          );
          if (session.pendingChanges) {
            session.pendingChanges.push(...finalChanges);
            publishChanges(session, session.pendingChanges);
            session.pendingChanges = undefined;
          } else {
            publishChanges(session, finalChanges);
          }
          publish({
            type: "session.status",
            providerId: id,
            directory: session.directory,
            sessionId: session.id,
            status: "idle",
            runStatus:
              response.stopReason === "cancelled" ? "cancelled" : "completed",
          });
          return { interactionId: session.id, value: response };
        } catch (error) {
          console.log(error);
          closeSession(session, error);
          publish({
            type: "session.status",
            providerId: id,
            directory: session.directory,
            sessionId: session.id,
            status: "idle",
            runStatus: "idle",
          });
          throw new ConflictError(
            "Sending to the original session failed. Your draft was kept; delivery may be uncertain.",
          );
        }
      } finally {
        session.prompting = false;
        releaseTurn();
        if (session.turn === turn) session.turn = undefined;
      }
    },
    async listMessages(input: { sessionId: string; directory?: string }) {
      const creating = creatingSessions.get(input.sessionId);
      if (creating) {
        await creating;
        const session = getSession(sessions, input.sessionId);
        return {
          messages: session.messageState.messages,
          historyUnavailable: session.historyUnavailable,
        };
      }
      let session = sessions.get(input.sessionId);
      if (!session || session.closed) {
        if (!input.directory)
          throw new Error("ACP sessions require an absolute directory");
        await adapter.createSession({
          sessionId: input.sessionId,
          directory: input.directory,
        });
        session = getSession(sessions, input.sessionId);
        return {
          messages: session.messageState.messages,
          historyUnavailable: session.historyUnavailable,
        };
      }
      if (
        session.capabilities?.loadSession &&
        !session.prompting &&
        !session.historyUnavailable
      ) {
        try {
          await loadMessages(session);
        } catch {
          session.historyUnavailable = true;
        }
      }
      return {
        messages: session.messageState.messages,
        historyUnavailable: session.historyUnavailable,
      };
    },
    async abortSession(input: { sessionId: string }): Promise<void> {
      const session = getSession(sessions, input.sessionId);
      try {
        await session.connection.agent.notify(
          acp.methods.agent.session.cancel,
          {
            sessionId: session.id,
          },
        );
      } finally {
        closeSession(session);
      }
    },
    async deleteSession(input: { sessionId: string }): Promise<void> {
      const session = getSession(sessions, input.sessionId);
      try {
        if (session.capabilities?.sessionCapabilities?.delete)
          await session.connection.agent.request(
            acp.methods.agent.session.delete,
            { sessionId: session.id },
          );
        else if (session.capabilities?.sessionCapabilities?.close)
          await session.connection.agent.request(
            acp.methods.agent.session.close,
            { sessionId: session.id },
          );
      } finally {
        closeSession(session);
      }
    },
    async listPermissions(input: {
      directory?: string;
    }): Promise<PermissionRequest[]> {
      const requests: PermissionRequest[] = [];
      for (const session of sessions.values()) {
        if (
          session.closed ||
          (input.directory && input.directory !== session.directory)
        )
          continue;
        for (const pending of session.pendingPermissions.values())
          requests.push(pending.request);
      }
      return requests;
    },
    async respondToInteraction(response: InteractionResponseInput) {
      const session = sessions.get(response.sessionId);
      if (
        !session ||
        session.closed ||
        (response.directory && response.directory !== session.directory)
      )
        throw new NotFoundError("ACP permission request not found");
      const pending = session.pendingPermissions.get(response.interactionId);
      if (!pending || pending.request.sessionId !== response.sessionId)
        throw new NotFoundError("ACP permission request not found");
      if (response.kind === "question")
        throw new ValidationError("ACP question responses are not supported");
      const optionId = permissionOptionId(
        response.value,
        pending.params.options,
      );
      session.pendingPermissions.delete(response.interactionId);
      pending.resolve({ outcome: { outcome: "selected", optionId } });
      return { interactionId: response.interactionId, value: null };
    },
    subscribeEvents(input: ProviderEventsInput = {}): AsyncIterable<ChatEvent> {
      const subscriber: Subscriber = {
        input,
        values: [],
        pending: [],
        closed: false,
      };
      subscribers.add(subscriber);
      const stop = () => closeSubscriber(subscriber, subscribers);
      input.signal?.addEventListener("abort", stop, { once: true });
      return {
        [Symbol.asyncIterator]() {
          return {
            next: () => {
              if (subscriber.closed)
                return Promise.resolve({ done: true, value: undefined });
              const value = subscriber.values.shift();
              if (value) return Promise.resolve({ done: false, value });
              return new Promise<IteratorResult<ChatEvent>>((resolve) =>
                subscriber.pending.push(resolve),
              );
            },
            return: () => {
              input.signal?.removeEventListener("abort", stop);
              closeSubscriber(subscriber, subscribers);
              return Promise.resolve({ done: true, value: undefined });
            },
            [Symbol.asyncIterator]() {
              return this;
            },
          };
        },
      };
    },
  } satisfies AcpAdapter;

  return adapter;
}

function getSession(sessions: Map<string, AcpSession>, sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || session.closed) throw new Error("ACP session not found");
  return session;
}

function permissionOptionId(
  value: unknown,
  options: acp.PermissionOption[],
): string {
  if (typeof value === "object" && value !== null && "reply" in value) {
    const kind =
      value.reply === "once"
        ? "allow_once"
        : value.reply === "always"
          ? "allow_always"
          : value.reply === "reject"
            ? "reject_once"
            : undefined;
    const option = kind && options.find((option) => option.kind === kind);
    if (!option)
      throw new ValidationError(
        "ACP permission reply is not supported by this request",
      );
    return option.optionId;
  }
  const optionId =
    typeof value === "string"
      ? value
      : typeof value === "object" && value !== null && "optionId" in value
        ? value.optionId
        : undefined;
  if (
    typeof optionId !== "string" ||
    !options.some((option) => option.optionId === optionId)
  )
    throw new ValidationError(
      "ACP permission option is not supported by this request",
    );
  return optionId;
}

function matches(input: ProviderEventsInput, event: ChatEvent) {
  if (input.directory && event.directory !== input.directory) return false;
  if (
    input.sessionId &&
    (!("sessionId" in event) || event.sessionId !== input.sessionId)
  )
    return false;
  return true;
}

function closeSubscriber(subscriber: Subscriber, subscribers: Set<Subscriber>) {
  if (subscriber.closed) return;
  subscriber.closed = true;
  subscribers.delete(subscriber);
  for (const resolve of subscriber.pending.splice(0))
    resolve({ done: true, value: undefined });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timed = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timed]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}
