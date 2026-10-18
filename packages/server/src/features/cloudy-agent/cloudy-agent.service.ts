import { randomUUID } from "node:crypto";
import type {
  ChatEvent,
  ChatMessage,
  ChatSession,
  ProviderMessageRequest,
  ProviderSessionInput,
} from "@repo/ai-core";
import type { CloudyMessagesRepository } from "../sessions/cloudy-messages.repository";
import type { LLM, LLMClient } from "../../lib/llm-provider";
import { namingSession } from "./naming-session";

export function createCloudyAgent({
  apiProviderRegistry,
  messagesRepository,
  publish,
}: {
  apiProviderRegistry: LLM;
  messagesRepository: CloudyMessagesRepository;
  publish: (event: ChatEvent) => void;
}) {
  const runs = new Map<string, AbortController>();

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
      throw new Error("A model must be selected for Cloudy AI");
    const provider = apiProviderRegistry.getClient(connectionId);
    if (!provider) throw new Error(`API provider not found: ${connectionId}`);

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
      for await (const chunk of provider.chatAsync({
        model,
        message: request.content,
        messages: history,
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

  return { createSession, sendMessage, abortSession };
}
