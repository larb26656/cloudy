import { randomUUID } from "node:crypto";
import type {
  ChatEvent,
  ChatSession,
  AgentProviderAdapter,
  ProviderEventsInput,
  AgentProviderInfo,
  ProviderMessageRequest,
  ProviderSessionInput,
} from "@repo/ai-core";

import type { LLM } from "../../lib/llm-provider";
import type { SessionsRepository } from "../../features/sessions/sessions.repository";
import type { CloudyMessagesRepository } from "../../features/sessions/cloudy-messages.repository";
import { createCloudyAgent } from "../../features/cloudy-agent/cloudy-agent.service";

export function createCloudyAdapter({
  apiProviderRegistry,
  sessionsRepository,
  messagesRepository,
}: {
  apiProviderRegistry: LLM;
  sessionsRepository: SessionsRepository;
  messagesRepository: CloudyMessagesRepository;
}): AgentProviderAdapter {
  const subscribers = new Set<(event: ChatEvent) => void>();
  const capabilities = {
    streaming: true,
    requiresDirectory: false,
    models: true,
  };

  const toSession = (id: string): ChatSession => {
    const record = sessionsRepository.findByProviderSessionId("cloudy", id);
    if (!record) throw new Error(`Cloudy session not found: ${id}`);
    return {
      id,
      title: record.title ?? "Cloudy chat",
      status: record.status,
      runStatus: record.runStatus,
      providerId: "cloudy",
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      directory: record.directory ?? undefined,
      parentId: record.parentId ?? undefined,
      metadata: record.metadata ?? undefined,
    };
  };

  const publish = (event: ChatEvent) => {
    for (const subscriber of subscribers) subscriber(event);
  };
  const agent = createCloudyAgent({
    apiProviderRegistry,
    messagesRepository,
    publish,
  });

  const adapter = {
    id: "cloudy",
    capabilities,
    async getInfo(): Promise<AgentProviderInfo> {
      return {
        id: "cloudy",
        providerType: "cloudy",
        name: "Cloudy",
        capabilities,
        models: apiProviderRegistry.listModels(),
      };
    },
    async createSession(input: ProviderSessionInput): Promise<ChatSession> {
      const now = new Date().toISOString();
      const session: ChatSession = {
        id: randomUUID(),
        title: input.title ?? "Cloudy chat",
        status: "idle",
        runStatus: "idle",
        providerId: "cloudy",
        createdAt: now,
        updatedAt: now,
        directory: input.directory,
        parentId: input.parentId,
      };
      return session;
    },
    async listSessions(input: { directory?: string; limit?: number }) {
      const values = sessionsRepository
        .list(input)
        .filter((record) => record.providerId === "cloudy")
        .map((record) => toSession(record.providerSessionId))
        .filter(
          (session) =>
            !input.directory || session.directory === input.directory,
        );
      return input.limit ? values.slice(0, input.limit) : values;
    },
    async getSession(input: { sessionId: string }) {
      return toSession(input.sessionId);
    },
    async updateSession(input: ProviderSessionInput) {
      const session = toSession(input.sessionId ?? "");
      sessionsRepository.update(session.id, { title: input.title });
      return toSession(session.id);
    },
    async deleteSession(input: { sessionId: string }) {
      messagesRepository.deleteForSession(input.sessionId);
    },
    async getSessionChildren(input: { sessionId: string }) {
      return sessionsRepository
        .list({})
        .filter((record) => record.providerId === "cloudy")
        .map((record) => toSession(record.providerSessionId))
        .filter((session) => session.parentId === input.sessionId);
    },
    async getSessionStatuses() {
      return Object.fromEntries(
        sessionsRepository
          .list({})
          .filter((record) => record.providerId === "cloudy")
          .map((record) => [record.providerSessionId, record.runStatus]),
      );
    },
    async listMessages(input: {
      sessionId: string;
      limit?: number;
      before?: string;
    }) {
      const rows = messagesRepository.listBefore(input.sessionId, input);
      const hasMore = input.limit !== undefined && rows.length > input.limit;
      const messages = (hasMore ? rows.slice(0, input.limit) : rows).reverse();
      return {
        messages,
        ...(hasMore && messages[0] ? { nextCursor: messages[0].id } : {}),
      };
    },
    async sendMessage(request: ProviderMessageRequest) {
      toSession(request.sessionId);
      return agent.sendMessage(request);
    },
    async abortSession(input: { sessionId: string }) {
      await agent.abortSession(input.sessionId);
    },
    subscribeEvents(input: ProviderEventsInput = {}): AsyncIterable<ChatEvent> {
      return {
        [Symbol.asyncIterator]() {
          const queue: ChatEvent[] = [];
          let wake: (() => void) | undefined;
          let done = false;
          const onEvent = (event: ChatEvent) => {
            if (
              input.sessionId &&
              (!("sessionId" in event) || event.sessionId !== input.sessionId)
            )
              return;
            queue.push(event);
            wake?.();
          };
          const onAbort = () => {
            done = true;
            wake?.();
          };
          subscribers.add(onEvent);
          input.signal?.addEventListener("abort", onAbort, { once: true });
          if (input.signal?.aborted) onAbort();
          return {
            async next(): Promise<IteratorResult<ChatEvent>> {
              while (!queue.length && !done)
                await new Promise<void>((resolve) => {
                  wake = resolve;
                });
              const value = queue.shift();
              return value
                ? { done: false, value }
                : { done: true, value: undefined };
            },
            async return(): Promise<IteratorResult<ChatEvent>> {
              done = true;
              subscribers.delete(onEvent);
              input.signal?.removeEventListener("abort", onAbort);
              return { done: true, value: undefined };
            },
          };
        },
      };
    },
  } satisfies AgentProviderAdapter;

  return adapter;
}
