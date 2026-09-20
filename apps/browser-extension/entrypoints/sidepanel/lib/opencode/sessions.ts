import { type Session } from "@opencode-ai/sdk/v2/client";
import type { Message } from "@repo/ui/components/message/types";
import { createClient, getErrorMessage } from "./client";

export const INJECTED_CONTEXT_MARKER =
  "<!-- cloudy:browser-extension:injected-context -->";

export interface SessionModel {
  providerID: string;
  modelID: string;
}

export async function createBotSession(
  directory: string,
  model?: SessionModel | null,
): Promise<Session> {
  const result = await createClient(directory).session.create({
    directory,
    agent: "browser",
    model: model
      ? { id: model.modelID, providerID: model.providerID }
      : undefined,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return result.data;
}

export async function listSessions(directory: string): Promise<Session[]> {
  const result = await createClient(directory).session.list({ directory });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return result.data;
}

export async function loadSessionMessages(
  sessionId: string,
  directory: string,
): Promise<Message[]> {
  const result = await createClient(directory).session.messages({
    sessionID: sessionId,
    directory,
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

export function isInjectedContextMessage(message: Message): boolean {
  return (
    message.info.role === "user" &&
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
