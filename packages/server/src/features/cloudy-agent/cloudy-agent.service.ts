import { randomUUID } from "node:crypto";
import type {
  ChatEvent,
  ChatMessage,
  ChatSession,
  ProviderEventsInput,
  ProviderMessageRequest,
  ProviderSessionInput,
} from "@repo/ai-core";
import type { CloudyMessagesRepository } from "../sessions/sessions.cloudy-messages.repository";
import type { LLM, LLMClient } from "../../lib/llm-provider";
import { namingSession } from "./cloudy-agent.naming-session";
import { NotFoundError, ValidationError } from "../../shared/domain-error";

export function createCloudyAgent({
  apiProviderRegistry,
  messagesRepository,
  agents,
}: {
  apiProviderRegistry: LLM;
  messagesRepository: CloudyMessagesRepository;
  agents: () => { id: string; name: string; systemPrompt?: string }[];
}) {
  const runs = new Map<string, AbortController>();
  const subscribers = new Set<(event: ChatEvent) => void>();

  const publish = (event: ChatEvent) => {
    for (const subscriber of subscribers) subscriber(event);
  };

  const subscribeEvents = (
    input: ProviderEventsInput = {},
  ): AsyncIterable<ChatEvent> => ({
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
  });

  const createSession = async (
    input: ProviderSessionInput,
  ): Promise<ChatSession> => {
    const createdAt = new Date();
    const now = createdAt.toISOString();
    return {
      id: randomUUID(),
      title:
        input.title ??
        `New Session ${createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
      status: "idle",
      runStatus: "idle",
      providerId: "cloudy",
      createdAt: now,
      updatedAt: now,
      directory: input.directory,
      parentId: input.parentId,
    };
  };

  const sendMessage = async (request: ProviderMessageRequest) => {
    const isFirstMessage =
      messagesRepository.list(request.sessionId).length === 0;

    const userMessage: ChatMessage = {
      id: randomUUID(),
      sessionId: request.sessionId,
      role: "user",
      parts: [{ id: randomUUID(), type: "text", text: request.content }],
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: ChatMessage = {
      id: randomUUID(),
      sessionId: request.sessionId,
      role: "assistant",
      parts: [{ id: randomUUID(), type: "text", text: "" }],
      createdAt: new Date().toISOString(),
    };
    messagesRepository.append(userMessage, request.sessionId);
    messagesRepository.append(assistantMessage, request.sessionId);
    publish({
      type: "message.updated",
      providerId: "cloudy",
      sessionId: request.sessionId,
      message: userMessage,
    });
    publish({
      type: "message.updated",
      providerId: "cloudy",
      sessionId: request.sessionId,
      message: assistantMessage,
    });

    const connectionId = request.model?.providerId;
    const modelId = request.model?.modelId;
    if (!connectionId || !modelId)
      throw new ValidationError("A model must be selected for Cloudy AI");
    const provider = apiProviderRegistry.getClient(connectionId);
    if (!provider)
      throw new NotFoundError(`API provider not found: ${connectionId}`);

    const history = messagesRepository
      .list(request.sessionId)
      .filter((message) => message.id !== assistantMessage.id)
      .map((message) => ({
        role:
          message.role === "assistant"
            ? ("assistant" as const)
            : ("user" as const),
        content: message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(""),
      }))
      .filter((message) => message.content.length > 0);

    runs.get(request.sessionId)?.abort();
    const controller = new AbortController();
    runs.set(request.sessionId, controller);
    publish({
      type: "session.status",
      providerId: "cloudy",
      sessionId: request.sessionId,
      status: "active",
      runStatus: "running",
    });
    void run(
      request,
      isFirstMessage,
      provider,
      modelId,
      history,
      assistantMessage,
      controller,
    );
    return { interactionId: request.sessionId, value: null, isFirstMessage };
  };

  const abortSession = async (sessionId: string): Promise<void> => {
    runs.get(sessionId)?.abort();
  };

  async function run(
    request: ProviderMessageRequest,
    isFirstMessage: boolean,
    provider: LLMClient,
    model: string,
    history: { role: "user" | "assistant"; content: string }[],
    assistantMessage: ChatMessage,
    controller: AbortController,
  ) {
    const part = assistantMessage.parts[0];
    if (!part || part.type !== "text") return;
    let text = "";
    try {
      const selectedAgent = agents().find(
        (agent) =>
          agent.id === request.agentId || agent.name === request.agentId,
      );
      for await (const chunk of provider.chatAsync({
        model,
        message: request.content,
        messages: [
          ...(selectedAgent?.systemPrompt
            ? [{ role: "system" as const, content: selectedAgent.systemPrompt }]
            : []),
          ...history,
        ],
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) break;
        text += chunk.text;
        publish({
          type: "message.delta",
          providerId: "cloudy",
          sessionId: request.sessionId,
          messageId: assistantMessage.id,
          partId: part.id,
          delta: chunk.text,
        });
      }
      if (controller.signal.aborted) {
        publish({
          type: "session.status",
          providerId: "cloudy",
          sessionId: request.sessionId,
          status: "idle",
          runStatus: "cancelled",
        });
      } else {
        const finishPart: ChatMessage["parts"][number] = {
          id: randomUUID(),
          type: "step-finish",
          reason: "stop",
          modelID: model,
          agent: request.agentId,
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        };
        assistantMessage.parts = [{ ...part, text }, finishPart];
        messagesRepository.update(assistantMessage, request.sessionId);

        if (isFirstMessage) {
          void namingSession(model, provider, text)
            .then((sessionName) => {
              publish({
                type: "session.title.updated",
                providerId: "cloudy",
                sessionId: request.sessionId,
                title: sessionName,
              });
            })
            .catch(() => {});
        }

        publish({
          type: "message.part.updated",
          providerId: "cloudy",
          sessionId: request.sessionId,
          messageId: assistantMessage.id,
          part: finishPart,
        });
        publish({
          type: "session.status",
          providerId: "cloudy",
          sessionId: request.sessionId,
          status: "idle",
          runStatus: "completed",
        });
      }
    } catch (error) {
      assistantMessage.error = {
        name: "LLMError",
        message: error instanceof Error ? error.message : String(error),
        data: {
          message: error instanceof Error ? error.message : String(error),
        },
      };
      messagesRepository.update(assistantMessage, request.sessionId);
      publish({
        type: "run.failed",
        providerId: "cloudy",
        sessionId: request.sessionId,
        message: assistantMessage.error.message,
        error,
      });
      publish({
        type: "session.status",
        providerId: "cloudy",
        sessionId: request.sessionId,
        status: "idle",
        runStatus: "failed",
      });
    } finally {
      if (runs.get(request.sessionId) === controller)
        runs.delete(request.sessionId);
    }
  }

  return { createSession, sendMessage, abortSession, subscribeEvents };
}
