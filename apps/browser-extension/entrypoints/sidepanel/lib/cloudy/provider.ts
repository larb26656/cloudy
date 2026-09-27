import { cloudyApiUrl } from "../../config/env";
import type {
  ChatEvent,
  ChatMessage,
  ChatSession as CoreChatSession,
  ModelInfo,
  ProviderInfo,
} from "@repo/contracts";

const providerPath = `${cloudyApiUrl}/api/providers/opencode`;
const catalogPath = `${cloudyApiUrl}/api/providers`;

export interface ProviderSession {
  id: string;
  title?: string;
  parentID?: string;
  directory: string;
  updatedAt?: number;
  cost?: number;
  tokens?: CoreChatSession["tokens"];
}

export interface ProviderModel {
  providerID: string;
  modelID: string;
}

export interface ProviderSendMessageInput {
  sessionId: string;
  directory: string;
  content: string;
  model?: ProviderModel | null;
  agentId?: string;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${providerPath}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init?.headers },
  });
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

function query(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, value);
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function toSession(session: CoreChatSession): ProviderSession {
  return {
    id: session.id,
    title: session.title,
    parentID: session.parentId,
    directory: session.directory ?? "",
    updatedAt: Date.parse(session.updatedAt),
    cost: session.cost,
    tokens: session.tokens,
  };
}

export async function listProviderSessions(
  directory: string,
): Promise<ProviderSession[]> {
  const response = await request(`/sessions${query({ directory })}`);
  return (await json<CoreChatSession[]>(response)).map(toSession);
}

export async function createProviderSession(
  directory: string,
  model?: ProviderModel | null,
): Promise<ProviderSession> {
  const response = await request(
    "/sessions",
    jsonInit({
      directory,
      agentId: "browser",
      model: model
        ? { providerId: model.providerID, modelId: model.modelID }
        : undefined,
    }),
  );
  return toSession(await json<CoreChatSession>(response));
}

export async function loadProviderMessages(
  sessionId: string,
  directory: string,
): Promise<ChatMessage[]> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}/messages${query({ directory })}`,
  );
  const result = await json<{ messages: ChatMessage[] }>(response);
  return result.messages;
}

export async function sendProviderMessage(
  input: ProviderSendMessageInput,
): Promise<void> {
  await json(
    await request(
      "/messages",
      jsonInit({
        sessionId: input.sessionId,
        directory: input.directory,
        content: input.content,
        model: input.model
          ? {
              providerId: input.model.providerID,
              modelId: input.model.modelID,
            }
          : undefined,
        agentId: input.agentId,
      }),
    ),
  );
}

export async function abortProviderSession(
  sessionId: string,
  directory: string,
): Promise<void> {
  const response = await request(
    `/sessions/${encodeURIComponent(sessionId)}/abort${query({ directory })}`,
    jsonInit({}),
  );
  if (!response.ok) throw new Error(await response.text());
}

export async function listProviderModels(): Promise<ModelInfo[]> {
  const response = await fetch(catalogPath, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const providers = await json<ProviderInfo[]>(response);
  return providers.flatMap((provider) => provider.models ?? []);
}

export async function subscribeToProviderEvents(
  directory: string,
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(
    `${providerPath}/events${query({ directory })}`,
    {
      credentials: "include",
      headers: { Accept: "text/event-stream" },
      signal,
    },
  );
  if (!response.ok || !response.body) {
    throw new Error(`Provider event stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (data) onEvent(JSON.parse(data) as ChatEvent);
      }
    }
  } finally {
    await reader.cancel();
  }
}
