import { randomUUID } from "node:crypto";
import type {
  ChatEvent,
  ChatMessage,
  ProviderMessageRequest,
} from "@repo/ai-core";
import type { CloudyMessagesRepository } from "../sessions/cloudy-messages.repository";
import type { LLM } from "../../lib/llm-provider";

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

  const sendMessage = async (request: ProviderMessageRequest) => {
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
    void run(request, provider, modelId, history, assistantMessage, controller);
    return { interactionId: request.sessionId, value: null };
  };

  const abortSession = async (sessionId: string): Promise<void> => {
    runs.get(sessionId)?.abort();
  };

  async function run(
    request: ProviderMessageRequest,
    provider: NonNullable<ReturnType<LLM["getClient"]>>,
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
        assistantMessage.parts = [{ ...part, text }];
        messagesRepository.update(assistantMessage, request.sessionId);
        publish({
          type: "message.part.updated",
          providerId: "cloudy",
          sessionId: request.sessionId,
          messageId: assistantMessage.id,
          part: assistantMessage.parts[0]!,
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

  return { sendMessage, abortSession };
}
