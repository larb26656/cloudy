import {
  createOpencodeClient,
  type GlobalEvent,
  type Part,
  type Session,
} from "@opencode-ai/sdk/v2/client";
import type { Message } from "@repo/ui/components/message/types";

export const CLOUDY_PROXY_URL = "http://localhost:4122/oc";
export const ASK_DIRECTORY = "/Users/luckytime1996/Documents/Work/ask";
export const SESSION_STORAGE_KEY = "latest-session-id";

export type StreamState = {
  messages: Map<string, Message>;
  pendingDeltas: Map<string, string>;
  parts: Map<string, Map<string, Extract<Part, { type: "text" }>>>;
};

const client = createOpencodeClient({
  baseUrl: CLOUDY_PROXY_URL,
  headers: { "X-OpenCode-Directory": ASK_DIRECTORY },
});

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "OpenCode request failed";
}

export async function getStoredSessionId(): Promise<string | null> {
  const stored = await browser.storage.local.get(SESSION_STORAGE_KEY);
  const value = stored[SESSION_STORAGE_KEY];
  return typeof value === "string" ? value : null;
}

export async function storeSessionId(sessionId: string): Promise<void> {
  await browser.storage.local.set({ [SESSION_STORAGE_KEY]: sessionId });
}

export async function clearStoredSessionId(): Promise<void> {
  await browser.storage.local.remove(SESSION_STORAGE_KEY);
}

export async function createBotSession(): Promise<Session> {
  const result = await client.session.create({
    directory: ASK_DIRECTORY,
    agent: "bot",
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return result.data;
}

export async function loadSessionMessages(
  sessionId: string,
): Promise<Message[]> {
  const result = await client.session.messages({
    sessionID: sessionId,
    directory: ASK_DIRECTORY,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));

  return result.data.map((message) => ({
    info: message.info,
    parts: message.parts.filter(
      (part): part is Extract<Part, { type: "text" }> => part.type === "text",
    ),
  }));
}

export async function sendPrompt(
  sessionId: string,
  text: string,
): Promise<void> {
  const result = await client.session.promptAsync({
    sessionID: sessionId,
    directory: ASK_DIRECTORY,
    agent: "bot",
    parts: [{ type: "text", text }],
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
}

export async function abortSession(sessionId: string): Promise<void> {
  const result = await client.session.abort({
    sessionID: sessionId,
    directory: ASK_DIRECTORY,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
}

export async function subscribeToEvents(
  onEvent: (event: GlobalEvent) => void,
): Promise<() => void> {
  const { stream } = await client.global.event({
    sseMaxRetryAttempts: 5,
    sseMaxRetryDelay: 3000,
  });
  let stopped = false;

  void (async () => {
    try {
      for await (const event of stream) {
        if (!stopped && event.directory === ASK_DIRECTORY) onEvent(event);
      }
    } catch (error) {
      if (!stopped) console.error("OpenCode event stream failed", error);
    }
  })();

  return () => {
    stopped = true;
    void stream.return(undefined);
  };
}

function ensureMessage(
  state: StreamState,
  id: string,
  role: "user" | "assistant",
  sessionId: string,
): Message {
  return (
    state.messages.get(id) ?? {
      info: {
        id,
        sessionID: sessionId,
        role,
        time: { created: Date.now() },
      } as Message["info"],
      parts: [],
    }
  );
}

export function applyStreamEvent(
  state: StreamState,
  event: GlobalEvent,
  sessionId: string,
): StreamState {
  const payload = event.payload;
  const nextMessages = new Map(state.messages);
  const pendingDeltas = new Map(state.pendingDeltas);
  const parts = new Map(state.parts);

  if (payload.type === "message.updated") {
    if (payload.properties.info.sessionID !== sessionId) return state;
    const current =
      nextMessages.get(payload.properties.info.id) ??
      ensureMessage(
        state,
        payload.properties.info.id,
        payload.properties.info.role,
        sessionId,
      );
    nextMessages.set(payload.properties.info.id, {
      ...current,
      info: payload.properties.info,
    });
  }

  if (payload.type === "message.part.updated") {
    if (
      payload.properties.part.sessionID !== sessionId ||
      payload.properties.part.type !== "text"
    )
      return state;
    const part = payload.properties.part;
    const messageParts = new Map(parts.get(part.messageID));
    const pending = pendingDeltas.get(part.id) ?? "";
    const nextPart = pending ? { ...part, text: part.text + pending } : part;
    messageParts.set(part.id, nextPart);
    parts.set(part.messageID, messageParts);
    nextMessages.set(part.messageID, {
      ...(nextMessages.get(part.messageID) ??
        ensureMessage(state, part.messageID, "assistant", sessionId)),
      parts: Array.from(messageParts.values()),
    });
    pendingDeltas.delete(part.id);
  }

  if (payload.type === "message.part.delta") {
    if (payload.properties.sessionID !== sessionId) return state;
    const { messageID, partID, delta } = payload.properties;
    const messageParts = parts.get(messageID);
    const currentPart = messageParts?.get(partID);
    if (!messageParts || !currentPart) {
      pendingDeltas.set(partID, (pendingDeltas.get(partID) ?? "") + delta);
    } else {
      const nextParts = new Map(messageParts);
      nextParts.set(partID, { ...currentPart, text: currentPart.text + delta });
      parts.set(messageID, nextParts);
      const current =
        nextMessages.get(messageID) ?? state.messages.get(messageID);
      if (current)
        nextMessages.set(messageID, {
          ...current,
          parts: Array.from(nextParts.values()),
        });
    }
  }

  return { messages: nextMessages, pendingDeltas, parts };
}
