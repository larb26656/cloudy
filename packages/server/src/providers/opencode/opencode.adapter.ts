import {
  createOpencodeClient,
  type OpencodeClient,
} from "@opencode-ai/sdk/v2/client";
import type {
  ChatEvent,
  ChatSession,
  ProviderAdapter,
  ProviderMessageRequest,
  ProviderMessagesInput,
  ProviderSessionInput,
  ProviderEventsInput,
  ProviderInfo,
  PermissionRequest,
  ProviderQuestionRequest,
  RunStatus,
  CommandInfo,
  FileContent,
  FileNode,
  VcsFileDiff,
} from "@repo/ai-core";
import {
  toAgentInfo,
  toChatEvent,
  toChatMessage,
  toChatSession,
  toModelInfo,
  toPermissionRequest,
  toQuestionRequest,
} from "./opencode.mapper";
import { NotFoundError } from "../../shared/domain-error";

function throwInteractionError(error: unknown): never {
  if (typeof error === "object" && error !== null) {
    const value = error as { _tag?: unknown; message?: unknown };
    const message =
      typeof value.message === "string"
        ? value.message
        : "Interaction not found";
    if (value._tag === "QuestionNotFoundError") {
      throw new NotFoundError(message);
    }
    throw new Error(message);
  }
  throw error instanceof Error ? error : new Error(String(error));
}

function isQuestionNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { _tag?: unknown })._tag === "QuestionNotFoundError"
  );
}

export interface OpenCodeAdapterOptions {
  baseUrl: string;
  client?: OpencodeClient;
}

export function createOpenCodeAdapter({
  baseUrl,
  client = createOpencodeClient({ baseUrl }),
}: OpenCodeAdapterOptions): ProviderAdapter {
  const adapter = {
    id: "opencode",
    capabilities: {
      streaming: true,
      attachments: true,
      tools: true,
      reasoning: true,
      models: true,
      agents: true,
    },
    async listSessions(input: {
      directory?: string;
      limit?: number;
    }): Promise<ChatSession[]> {
      const result = await client.v2.session.list(input);
      if (result.error) throw result.error;
      return result.data.data.map((session) =>
        toChatSession(session, "opencode", input.directory),
      );
    },
    async getSession(input: {
      sessionId: string;
      directory?: string;
    }): Promise<ChatSession> {
      const result = await client.session.get({
        sessionID: input.sessionId,
        directory: input.directory,
      });
      if (result.error) throw result.error;
      return toChatSession(result.data, "opencode", input.directory);
    },
    async getSessionChildren(input: {
      sessionId: string;
      directory?: string;
    }): Promise<ChatSession[]> {
      const result = await client.session.children({
        sessionID: input.sessionId,
        directory: input.directory,
      });
      if (result.error) throw result.error;
      return result.data.map((session) =>
        toChatSession(session, "opencode", input.directory),
      );
    },
    async getSessionStatuses(input: {
      directory?: string;
    }): Promise<Record<string, RunStatus>> {
      const result = await client.session.status({
        directory: input.directory,
      });
      if (result.error) throw result.error;
      return Object.fromEntries(
        Object.entries(result.data ?? {}).map(([id, status]) => [
          id,
          status.type === "busy"
            ? "running"
            : status.type === "retry"
              ? "queued"
              : "idle",
        ]),
      );
    },
    async listMessages(input: ProviderMessagesInput) {
      const result = await client.session.messages({
        sessionID: input.sessionId,
        directory: input.directory,
        limit: input.limit,
        before: input.before,
      });
      if (result.error) throw result.error;
      return {
        messages: result.data.map(({ info, parts }) =>
          toChatMessage(info, parts),
        ),
      };
    },
    async createSession(input: ProviderSessionInput): Promise<ChatSession> {
      const result = await client.session.create({
        directory: input.directory,
        parentID: input.parentId,
        title: input.title,
        agent: input.agentId,
        model: input.model
          ? { providerID: input.model.providerId, id: input.model.modelId }
          : undefined,
        metadata: input.metadata,
      });
      if (result.error) throw result.error;
      return toChatSession(result.data, "opencode", input.directory);
    },
    async updateSession(input: ProviderSessionInput): Promise<ChatSession> {
      const result = await client.session.update({
        sessionID: input.sessionId ?? "",
        directory: input.directory,
        title: input.title,
        metadata: input.metadata,
      });
      if (result.error) throw result.error;
      return toChatSession(result.data, "opencode", input.directory);
    },
    async deleteSession(input: {
      sessionId: string;
      directory?: string;
    }): Promise<void> {
      const result = await client.session.delete({
        sessionID: input.sessionId,
        directory: input.directory,
      });
      if (result.error) throw result.error;
    },
    async forkSession(input: ProviderSessionInput): Promise<ChatSession> {
      const result = await client.session.fork({
        sessionID: input.sessionId ?? "",
        directory: input.directory,
        messageID: input.messageId,
      });
      if (result.error) throw result.error;
      return toChatSession(result.data, "opencode", input.directory);
    },
    async abortSession(input: {
      sessionId: string;
      directory?: string;
    }): Promise<void> {
      const result = await client.session.abort({
        sessionID: input.sessionId,
        directory: input.directory,
      });
      if (result.error) throw result.error;
    },
    async sendMessage(request: ProviderMessageRequest) {
      const parts = [
        { type: "text" as const, text: request.content },
        ...(request.attachments ?? []).map((attachment) => ({
          type: "file" as const,
          mime: attachment.mimeType ?? "application/octet-stream",
          url:
            typeof attachment.data === "string"
              ? attachment.data
              : (attachment.url ?? ""),
          filename: attachment.name,
        })),
      ];
      const result = await client.session.promptAsync({
        sessionID: request.sessionId,
        directory: request.directory,
        model: request.model
          ? {
              providerID: request.model.providerId,
              modelID: request.model.modelId,
            }
          : undefined,
        variant: request.model?.variantId,
        agent: request.agentId,
        parts,
      });
      if (result.error) throw result.error;
      return { interactionId: request.sessionId, value: result.data };
    },
    async respondToInteraction(response) {
      if (response.kind === "permission") {
        const result = await client.permission.reply({
          requestID: response.interactionId,
          directory:
            typeof response.value === "object" &&
            response.value !== null &&
            "directory" in response.value
              ? String(response.value.directory)
              : undefined,
          reply:
            typeof response.value === "object" &&
            response.value !== null &&
            "reply" in response.value
              ? (response.value.reply as "once" | "always" | "reject")
              : "reject",
        });
        if (result.error) throw result.error;
      } else {
        const isReject =
          typeof response.value === "object" &&
          response.value !== null &&
          "reject" in response.value;
        if (response.sessionId) {
          const sessionResult = isReject
            ? await client.v2.session.question.reject({
                sessionID: response.sessionId,
                requestID: response.interactionId,
              })
            : await client.v2.session.question.reply({
                sessionID: response.sessionId,
                requestID: response.interactionId,
                questionV2Reply: {
                  answers: response.value as Array<string[]>,
                },
              });

          if (!sessionResult.error) {
            return { interactionId: response.interactionId, value: null };
          }
          if (!isQuestionNotFoundError(sessionResult.error)) {
            throwInteractionError(sessionResult.error);
          }
        }

        const result = isReject
          ? await client.question.reject({
              requestID: response.interactionId,
              directory: response.directory,
            })
          : await client.question.reply({
              requestID: response.interactionId,
              answers: response.value as Array<string[]>,
              directory: response.directory,
            });
        if (result.error) throwInteractionError(result.error);
      }
      return { interactionId: response.interactionId, value: null };
    },
    async listPermissions(input: {
      directory?: string;
    }): Promise<PermissionRequest[]> {
      const result = await client.permission.list(input);
      if (result.error) throw result.error;
      return (result.data ?? []).map(toPermissionRequest);
    },
    async listQuestions(input: {
      directory?: string;
      sessionId?: string;
    }): Promise<ProviderQuestionRequest[]> {
      if (input.sessionId) {
        const result = await client.v2.session.question.list({
          sessionID: input.sessionId,
        });
        if (result.error) throw result.error;
        return result.data.data.map(toQuestionRequest);
      }

      const result = await client.v2.question.request.list({
        location: input.directory ? { directory: input.directory } : undefined,
      });
      const requests = result.error
        ? []
        : result.data.data.map(toQuestionRequest);
      if (requests.length > 0) return requests;

      const legacyResult = await client.question.list({
        directory: input.directory,
      });
      if (!legacyResult.error)
        return (legacyResult.data ?? []).map(toQuestionRequest);
      if (!result.error) return requests;
      throw legacyResult.error;
    },
    async listFiles(input: {
      directory: string;
      path: string;
    }): Promise<FileNode[]> {
      const result = await client.file.list(input);
      if (result.error) throw result.error;
      return (result.data ?? []).map((file) => ({
        name: file.name,
        path: file.path,
        absolute: file.absolute,
        type: file.type,
        ignored: file.ignored,
      }));
    },
    async readFile(input: {
      directory: string;
      path: string;
    }): Promise<FileContent> {
      const result = await client.file.read(input);
      if (result.error) throw result.error;
      return { type: result.data.type, content: result.data.content };
    },
    async searchFiles(input: {
      directory: string;
      query: string;
      limit?: number;
    }): Promise<string[]> {
      const result = await client.find.files(input);
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    async listDiff(input: { directory: string }): Promise<VcsFileDiff[]> {
      const result = await client.vcs.diff({ ...input, mode: "git" });
      if (result.error) throw result.error;
      return (result.data ?? []).map((diff) => ({
        file: diff.file,
        additions: diff.additions,
        deletions: diff.deletions,
        status: diff.status,
        patch: diff.patch,
      }));
    },
    async listCommands(input: { directory: string }): Promise<CommandInfo[]> {
      const result = await client.command.list(input);
      if (result.error) throw result.error;
      return (result.data ?? []).map((command) => ({
        name: command.name,
        description: command.description,
        agent: command.agent,
        model: command.model,
        source: command.source,
        template: command.template,
        subtask: command.subtask,
        hints: command.hints,
      }));
    },
    async executeCommand(input: {
      sessionId: string;
      command: string;
      arguments?: string;
      directory: string;
    }): Promise<unknown> {
      const result = await client.session.command({
        sessionID: input.sessionId,
        command: input.command,
        arguments: input.arguments,
        directory: input.directory,
      });
      if (result.error) throw result.error;
      return result.data;
    },
    async getInfo(): Promise<ProviderInfo> {
      const [providerResult, agentResult] = await Promise.all([
        client.config.providers(),
        client.v2.agent.list({}),
      ]);

      if (providerResult.error) throw providerResult.error;
      if (agentResult.error) throw agentResult.error;

      const agents = agentResult.data.data.map(toAgentInfo);
      const providers = providerResult.data.providers;
      return {
        id: "opencode",
        name: "OpenCode",
        capabilities: adapter.capabilities,
        models: providers.flatMap((provider) =>
          Object.values(provider.models).map((model) => ({
            ...toModelInfo(provider.id, model),
            metadata: {
              provider: "opencode",
              upstreamProviderId: provider.id,
            },
          })),
        ),
        agents,
        metadata: {
          providerCount: providers.length,
          baseUrl,
        },
      };
    },
    subscribeEvents(input: ProviderEventsInput = {}): AsyncIterable<ChatEvent> {
      return streamEvents(client, input);
    },
  } satisfies ProviderAdapter;

  return adapter;
}

async function* streamEvents(
  client: OpencodeClient,
  input: ProviderEventsInput,
): AsyncGenerator<ChatEvent> {
  const result = await client.global.event({
    sseMaxRetryAttempts: 5,
    sseMaxRetryDelay: 3000,
  });
  const stream = result.stream;
  let stopped = false;
  const stop = () => {
    stopped = true;
    void stream.return(undefined);
  };

  if (input.signal?.aborted) {
    stop();
    return;
  }
  input.signal?.addEventListener("abort", stop, { once: true });

  try {
    for await (const event of stream) {
      if (stopped) break;
      if (input.directory && event.directory !== input.directory) continue;
      const normalized = toChatEvent(event, "opencode");
      if (!normalized) continue;
      if (
        input.sessionId &&
        ("sessionId" in normalized
          ? normalized.sessionId !== input.sessionId
          : true)
      )
        continue;
      yield normalized;
    }
  } finally {
    input.signal?.removeEventListener("abort", stop);
    stop();
  }
}
