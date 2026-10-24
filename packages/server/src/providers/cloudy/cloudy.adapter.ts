import type {
  ChatSession,
  AgentProviderAdapter,
  AgentProviderInfo,
  ProviderMessageRequest,
  ProviderSessionInput,
} from "@repo/ai-core";

import type { LLM } from "../../lib/llm-provider";
import type { SessionsRepository } from "../../features/sessions/sessions.repository";
import type { CloudyMessagesRepository } from "../../features/sessions/sessions.cloudy-messages.repository";
import { createCloudyAgent } from "../../features/cloudy-agent/cloudy-agent.service";

export function createCloudyAdapter({
  apiProviderRegistry,
  sessionsRepository,
  messagesRepository,
  agents,
}: {
  apiProviderRegistry: LLM;
  sessionsRepository: SessionsRepository;
  messagesRepository: CloudyMessagesRepository;
  agents: () => { id: string; name: string; systemPrompt?: string }[];
}): AgentProviderAdapter {
  const capabilities = {
    streaming: true,
    requiresDirectory: false,
    approvals: false,
    questions: false,
    models: true,
    agents: true,
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

  const agent = createCloudyAgent({
    apiProviderRegistry,
    messagesRepository,
    agents,
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
        agents: agents().map(({ id, name }) => ({ id, name, mode: "primary" })),
      };
    },
    async createSession(input: ProviderSessionInput): Promise<ChatSession> {
      return agent.createSession(input);
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
    subscribeEvents(input) {
      return agent.subscribeEvents(input);
    },
  } satisfies AgentProviderAdapter;

  return adapter;
}
