import { randomUUID } from "node:crypto";
import type {
  ChatEvent,
  ChatSession,
  ProviderMessageRequest,
} from "@repo/ai-core";
import type { SessionRecord } from "../../db/schema";
import { ValidationError } from "../../shared/domain-error";
import type { ProviderRegistry } from "../../providers";
import type {
  CommandInput,
  CreateSessionInput,
  MessageInput,
  UpdateSessionInput,
} from "./sessions.model";
import { SessionConflictError, SessionNotFoundError } from "./sessions.errors";
import type { SessionsRepository } from "./sessions.repository";

function toSession(record: SessionRecord): ChatSession {
  return {
    id: record.id,
    title: record.title ?? undefined,
    status: record.status,
    runStatus: record.runStatus,
    providerId: record.providerId,
    directory: record.directory ?? undefined,
    parentId: record.parentId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    metadata: record.metadata ?? undefined,
  };
}

export function createSessionsService(
  repository: SessionsRepository,
  registry: ProviderRegistry,
) {
  const getRecord = (id: string): SessionRecord => {
    const session = repository.findById(id);
    if (!session) throw new SessionNotFoundError(id);
    return session;
  };

  const toProviderInput = (record: SessionRecord) => ({
    sessionId: record.providerSessionId,
    directory: record.directory ?? undefined,
  });

  const create = async (input: CreateSessionInput): Promise<ChatSession> => {
    let providerParentId: string | undefined;
    if (input.parentId) {
      const parent = getRecord(input.parentId);
      if (parent.providerId !== input.providerId) {
        throw new ValidationError(
          "Parent session must use the selected provider",
        );
      }
      providerParentId = parent.providerSessionId;
    }

    const providerSession = await registry.createSession(input.providerId, {
      ...input,
      parentId: providerParentId,
    });
    if (
      repository.findByProviderSessionId(input.providerId, providerSession.id)
    ) {
      throw new SessionConflictError(input.providerId, providerSession.id);
    }
    const record = repository.create({
      id: randomUUID(),
      providerId: input.providerId,
      providerSessionId: providerSession.id,
      title: providerSession.title ?? input.title,
      directory: providerSession.directory ?? input.directory,
      parentId: input.parentId,
      metadata: input.metadata,
    });
    return toSession(record);
  };

  const list = (input: { directory?: string; limit?: number }): ChatSession[] =>
    repository.list(input).map(toSession);

  const get = async (id: string): Promise<ChatSession> => {
    const record = getRecord(id);
    const providerSession = await registry.getSession(
      record.providerId,
      toProviderInput(record),
    );
    const updated = repository.update(record.id, {
      title: providerSession.title,
      directory: providerSession.directory,
    });
    return {
      ...toSession(updated ?? record),
      status: providerSession.status,
      runStatus: providerSession.runStatus,
      model: providerSession.model,
      agent: providerSession.agent,
      cost: providerSession.cost,
      tokens: providerSession.tokens,
    };
  };

  const update = async (
    id: string,
    input: UpdateSessionInput,
  ): Promise<ChatSession> => {
    const record = getRecord(id);
    const providerSession = await registry.updateSession(record.providerId, {
      ...toProviderInput(record),
      ...input,
    });
    const updated = repository.update(id, {
      title: providerSession.title ?? input.title,
      directory: providerSession.directory ?? input.directory,
      metadata: input.metadata,
    });
    if (!updated) throw new SessionNotFoundError(id);
    return toSession(updated);
  };

  const remove = async (id: string): Promise<void> => {
    const record = getRecord(id);
    await registry.deleteSession(record.providerId, toProviderInput(record));
    repository.delete(id);
  };

  const children = async (id: string): Promise<ChatSession[]> => {
    const record = getRecord(id);
    const providerSessions = await registry.getSessionChildren(
      record.providerId,
      toProviderInput(record),
    );
    return providerSessions.flatMap((providerSession) => {
      const child = repository.findByProviderSessionId(
        record.providerId,
        providerSession.id,
      );
      return child ? [toSession(child)] : [];
    });
  };

  const status = async (id: string) => {
    const record = getRecord(id);
    const statuses = await registry.getSessionStatuses(record.providerId, {
      directory: record.directory ?? undefined,
    });
    return statuses[record.providerSessionId] ?? "idle";
  };

  const messages = async (
    id: string,
    input: { limit?: number; before?: string },
  ) => {
    const record = getRecord(id);
    const result = await registry.listMessages(record.providerId, {
      ...toProviderInput(record),
      ...input,
    });
    return {
      ...result,
      messages: result.messages.map((message) => ({
        ...message,
        sessionId: id,
      })),
    };
  };

  const questions = async (id: string) => {
    const record = getRecord(id);
    const requests = await registry.listQuestions(record.providerId, {
      directory: record.directory ?? undefined,
    });
    return requests
      .filter((request) => request.sessionId === record.providerSessionId)
      .map((request) => ({ ...request, sessionId: id }));
  };

  const respondToQuestion = async (
    id: string,
    interactionId: string,
    value: unknown,
  ) => {
    const record = getRecord(id);
    return registry.respondToInteraction(record.providerId, {
      kind: "question",
      sessionId: record.providerSessionId,
      interactionId,
      directory: record.directory ?? undefined,
      value,
    });
  };

  const permissions = async (id: string) => {
    const record = getRecord(id);
    const requests = await registry.listPermissions(record.providerId, {
      directory: record.directory ?? undefined,
    });
    return requests.flatMap((request) => {
      if (request.sessionId === record.providerSessionId) {
        return [{ ...request, sessionId: id }];
      }
      const child = repository.findByProviderSessionId(
        record.providerId,
        request.sessionId,
      );
      return child ? [{ ...request, sessionId: child.id }] : [];
    });
  };

  const respondToPermission = async (
    id: string,
    permissionId: string,
    reply: "once" | "always" | "reject",
  ) => {
    const record = getRecord(id);
    return registry.respondToInteraction(record.providerId, {
      kind: "permission",
      sessionId: record.providerSessionId,
      interactionId: permissionId,
      directory: record.directory ?? undefined,
      value: { reply, directory: record.directory ?? undefined },
    });
  };

  const sendMessage = async (id: string, input: MessageInput) => {
    const record = getRecord(id);
    const request: ProviderMessageRequest = {
      ...input,
      sessionId: record.providerSessionId,
      directory: record.directory ?? "",
    };
    const response = await registry.sendMessage(record.providerId, request);
    return { ...response, interactionId: id };
  };

  const executeCommand = (id: string, input: CommandInput) => {
    const record = getRecord(id);
    return registry.executeCommand(record.providerId, {
      sessionId: record.providerSessionId,
      command: input.command,
      arguments: input.arguments,
      directory: record.directory ?? "",
    });
  };

  const fork = async (
    id: string,
    input: { messageId?: string },
  ): Promise<ChatSession> => {
    const record = getRecord(id);
    const providerSession = await registry.forkSession(record.providerId, {
      ...toProviderInput(record),
      ...input,
    });
    if (
      repository.findByProviderSessionId(record.providerId, providerSession.id)
    ) {
      throw new SessionConflictError(record.providerId, providerSession.id);
    }
    const forked = repository.create({
      id: randomUUID(),
      providerId: record.providerId,
      providerSessionId: providerSession.id,
      title: providerSession.title,
      directory: providerSession.directory ?? record.directory,
      parentId: id,
    });
    return toSession(forked);
  };

  const abort = (id: string): Promise<void> => {
    const record = getRecord(id);
    return registry.abortSession(record.providerId, toProviderInput(record));
  };

  const mapEvent = (event: ChatEvent): ChatEvent => {
    if (!("sessionId" in event) || !event.sessionId) return event;
    const session = repository.findByProviderSessionId(
      event.providerId,
      event.sessionId,
    );
    if (!session) return event;
    if (event.type === "question.requested") {
      return {
        ...event,
        sessionId: session.id,
        request: { ...event.request, sessionId: session.id },
      };
    }
    if (event.type === "approval.requested") {
      return {
        ...event,
        sessionId: session.id,
        request: { ...event.request, sessionId: session.id },
      };
    }
    return { ...event, sessionId: session.id };
  };

  const applyEvent = async (event: ChatEvent): Promise<ChatEvent | null> => {
    if (!("sessionId" in event) || !event.sessionId) return event;
    const session = repository.findByProviderSessionId(
      event.providerId,
      event.sessionId,
    );
    if (!session) return null;

    const update: Parameters<SessionsRepository["update"]>[1] = {};
    if (event.type === "session.status") {
      update.status = event.status;
      update.runStatus = event.runStatus ?? "idle";
    } else if (event.type === "run.failed") {
      update.status = "idle";
      update.runStatus = "failed";
    }
    const updated = repository.update(session.id, update);
    return updated ? mapEvent(event) : null;
  };

  return {
    list,
    get,
    create,
    update,
    delete: remove,
    children,
    status,
    messages,
    questions,
    respondToQuestion,
    permissions,
    respondToPermission,
    sendMessage,
    executeCommand,
    fork,
    abort,
    mapEvent,
    applyEvent,
  };
}

export type SessionsService = ReturnType<typeof createSessionsService>;
