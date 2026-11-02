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
import type { ChildProcess, SpawnOptions } from "node:child_process";
import type {
  AgentProviderAdapter,
  AgentProviderInfo,
  ChatEvent,
  ChatSession,
  InteractionResponse,
  InteractionResponseInput,
  ModelInfo,
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

interface AcpSession {
  id: string;
  directory: string;
  process: ChildProcess;
  connection: acp.ClientConnection;
  capabilities: acp.AgentCapabilities | undefined;
  modelId?: string;
  // TODO: Move message persistence to the database layer.
  messageState: AcpMessageState;
  replaying: boolean;
  loadingMessages?: Promise<void>;
  prompting: boolean;
  pendingPermissions: Map<
    string,
    (response: acp.RequestPermissionResponse) => void
  >;
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
      await withTimeout(
        session.connection.agent.request(acp.methods.agent.session.load, {
          sessionId: session.id,
          cwd: session.directory,
          mcpServers: [],
        }),
        timeoutMs,
        "ACP session load timed out",
      );
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
    for (const resolve of session.pendingPermissions.values())
      resolve({ outcome: { outcome: "cancelled" } });
    session.pendingPermissions.clear();
    session.connection.close(error);
    session.process.stdin?.destroy();
    session.process.stdout?.destroy();
    if (!session.process.killed) session.process.kill();
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
    async getInfo(): Promise<AgentProviderInfo> {
      if (catalogDirectory && !catalogProbed) {
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
            for (const model of probeInfo.models ?? [])
              models.set(model.modelId, model);
          } catch (error) {
            console.warn("[ACP] Catalog discovery session failed", {
              providerId: id,
              error: error instanceof Error ? error.message : String(error),
            });
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
            catalogProbed = true;
          }
        })();
        await catalogProbe;
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
        metadata: { command: launch.command, args: launch.args },
      };
    },
    async createSession(input: ProviderSessionInput): Promise<ChatSession> {
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
      const pendingPermissions = new Map<
        string,
        (response: acp.RequestPermissionResponse) => void
      >();
      const stream = acp.ndJsonStream(
        Writable.toWeb(child.stdin),
        Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
      );
      const client = acp
        .client({ name: "cloudy" })
        .onRequest(
          acp.methods.client.session.requestPermission,
          ({ params }) => {
            const interactionId = `${params.sessionId}:${params.toolCall.toolCallId}`;
            publish({
              type: "approval.requested",
              providerId: id,
              directory: input.directory,
              sessionId: params.sessionId,
              request: {
                id: interactionId,
                sessionId: params.sessionId,
                permission:
                  params.toolCall.title ?? params.toolCall.name ?? "Tool call",
                patterns: [],
                metadata: {
                  toolCallId: params.toolCall.toolCallId,
                  options: params.options,
                },
              },
            });
            return new Promise<acp.RequestPermissionResponse>((resolve) => {
              pendingPermissions.set(interactionId, resolve);
            });
          },
        )
        .onNotification(acp.methods.client.session.update, ({ params }) => {
          const session = sessions.get(params.sessionId);
          if (!session) return;
          const update = params.update;
          if (update.sessionUpdate === "config_option_update") {
            const model = update.configOptions.find(
              (option) => option.id === "model" && option.type === "select",
            );
            if (model?.type === "select") session.modelId = model.currentValue;
          }
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
          if (!session.replaying) publishChanges(session, changes);
        });
      const connection = client.connect(stream);
      const session: AcpSession = {
        id: sessionId,
        directory: input.directory,
        process: child,
        connection,
        capabilities: undefined,
        messageState: createAcpMessageState(input.sessionId ?? sessionId),
        replaying: false,
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
        if (input.sessionId && !session.capabilities?.loadSession)
          throw new Error("ACP agent does not support loading sessions");
        if (input.sessionId) {
          session.id = input.sessionId;
          sessions.set(session.id, session);
          session.replaying = true;
        }
        const created = await withTimeout(
          connection.agent.request(
            input.sessionId
              ? acp.methods.agent.session.load
              : acp.methods.agent.session.new,
            input.sessionId
              ? {
                  sessionId: input.sessionId,
                  cwd: input.directory,
                  mcpServers: [],
                }
              : { cwd: input.directory, mcpServers: [] },
          ),
          timeoutMs,
          "ACP session creation timed out",
        );
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
                      ? item.options.map(({ value, name }) => ({ value, name }))
                      : [{ value: item.value, name: item.name }],
                  )
                : undefined,
          })),
        });
        for (const option of created.configOptions ?? []) {
          if (option.category !== "model" || option.type !== "select") continue;
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
        const selectedModel = created.configOptions?.find(
          (option) => option.id === "model" && option.type === "select",
        );
        if (selectedModel?.type === "select")
          session.modelId = selectedModel.currentValue;
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
    },
    async sendMessage(request: ProviderMessageRequest) {
      const session = getSession(sessions, request.sessionId);
      if (session.loadingMessages) await session.loadingMessages;
      if (request.attachments?.length)
        throw new Error("ACP attachments are not supported");
      session.prompting = true;
      publishChanges(
        session,
        startPrompt(
          session.messageState,
          request.content,
          request.turnId ?? crypto.randomUUID(),
        ),
      );
      publish({
        type: "session.status",
        providerId: id,
        directory: session.directory,
        sessionId: session.id,
        status: "active",
        runStatus: "running",
      });
      try {
        const response = await withTimeout(
          session.connection.agent.request(acp.methods.agent.session.prompt, {
            sessionId: session.id,
            prompt: [{ type: "text", text: request.content }],
          }),
          timeoutMs,
          "ACP prompt timed out",
        );
        publishChanges(
          session,
          finishPrompt(session.messageState, response, session.modelId),
        );
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
        closeSession(session, error);
        throw error;
      } finally {
        session.prompting = false;
      }
    },
    async listMessages(input: { sessionId: string; directory?: string }) {
      let session = sessions.get(input.sessionId);
      if (!session || session.closed) {
        if (!input.directory)
          throw new Error("ACP sessions require an absolute directory");
        await adapter.createSession({
          sessionId: input.sessionId,
          directory: input.directory,
        });
        session = getSession(sessions, input.sessionId);
        return { messages: session.messageState.messages };
      }
      if (session.capabilities?.loadSession && !session.prompting)
        await loadMessages(session);
      return { messages: session.messageState.messages };
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
    async respondToInteraction(response: InteractionResponseInput) {
      const session = getSession(sessions, response.sessionId);
      const resolve = session.pendingPermissions.get(response.interactionId);
      if (!resolve) throw new Error("ACP permission request not found");
      session.pendingPermissions.delete(response.interactionId);
      const optionId = permissionOptionId(response.value);
      resolve(
        optionId
          ? { outcome: { outcome: "selected", optionId } }
          : { outcome: { outcome: "cancelled" } },
      );
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

function permissionOptionId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "optionId" in value &&
    typeof value.optionId === "string"
  )
    return value.optionId;
  return undefined;
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
