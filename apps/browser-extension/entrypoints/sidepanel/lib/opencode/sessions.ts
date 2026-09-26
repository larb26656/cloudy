import { type Session } from "@opencode-ai/sdk/v2/client";
import { toChatMessage, type OpenCodeMessageWithParts } from "@repo/opencode";
import type { ChatMessage } from "@repo/opencode";
import { createClient, getErrorMessage } from "./client";

export const INJECTED_CONTEXT_MARKER =
  "<!-- cloudy:browser-extension:injected-context -->";

export interface SessionModel {
  providerID: string;
  modelID: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  parentID?: string;
  directory: string;
  updatedAt?: number;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
}

function toChatSession(session: Session): ChatSession {
  return {
    id: session.id,
    title: session.title,
    parentID: session.parentID,
    directory: session.directory,
    updatedAt: session.time.updated,
    cost: session.cost,
    tokens: session.tokens,
  };
}

export async function createBotSession(
  directory: string,
  model?: SessionModel | null,
): Promise<ChatSession> {
  const result = await createClient(directory).session.create({
    directory,
    agent: "browser",
    model: model
      ? { id: model.modelID, providerID: model.providerID }
      : undefined,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return toChatSession(result.data);
}

export async function listSessions(directory: string): Promise<ChatSession[]> {
  const result = await createClient(directory).session.list({ directory });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return result.data.map(toChatSession);
}

export async function loadSessionMessages(
  sessionId: string,
  directory: string,
): Promise<ChatMessage[]> {
  const result = await createClient(directory).session.messages({
    sessionID: sessionId,
    directory,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));

  return result.data.map(toMessage);
}

export function toMessage(message: OpenCodeMessageWithParts): ChatMessage {
  return toChatMessage(message.info, message.parts);
}

export function isInjectedContextMessage(message: ChatMessage): boolean {
  return (
    message.role === "user" &&
    message.parts.some(
      (part) =>
        part.type === "text" && part.text.startsWith(INJECTED_CONTEXT_MARKER),
    )
  );
}

export async function promptSession(
  sessionId: string,
  texts: string[],
  directory: string,
  model?: SessionModel | null,
): Promise<void> {
  const client = createClient(directory);
  const result = await client.session.promptAsync({
    sessionID: sessionId,
    directory,
    agent: "browser",
    model: model ?? undefined,
    parts: texts.map((text) => ({ type: "text", text })),
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
}

export async function abortSession(
  sessionId: string,
  directory: string,
): Promise<void> {
  const result = await createClient(directory).session.abort({
    sessionID: sessionId,
    directory,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
}
