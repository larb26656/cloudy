import {
  createOpencodeClient,
  type GlobalEvent,
  type Session,
} from "@opencode-ai/sdk/v2/client";
import type { Message } from "@repo/ui/components/message/types";
import {
  applyMessageStreamEvent,
  useStreamingMessagesStore,
  type MessageStreamState,
} from "@repo/opencode";

export const CLOUDY_PROXY_URL = "http://localhost:4122/oc";
export const ASK_DIRECTORY = "/Users/luckytime1996/Documents/Work/ask";
export const SESSION_STORAGE_KEY = "latest-session-id";

export type StreamState = MessageStreamState;

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

export async function listSessions(): Promise<Session[]> {
  const result = await client.session.list({ directory: ASK_DIRECTORY });
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

  return result.data.map(toMessage);
}

export function toMessage(message: Message): Message {
  return {
    info: message.info,
    parts: message.parts,
  };
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

export function applyStreamEvent(
  state: StreamState,
  event: GlobalEvent,
  sessionId: string,
): StreamState {
  return applyMessageStreamEvent(state, event, sessionId);
}

export function dispatchStreamEvent(
  event: GlobalEvent,
  sessionId: string,
): void {
  useStreamingMessagesStore.getState().applyEvent(sessionId, event);
}
