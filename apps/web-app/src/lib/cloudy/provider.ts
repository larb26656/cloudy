import { env } from "@/config/env";
import { joinUrl } from "@/lib/url";

const basePath = joinUrl(env.getApiUrl(), "/api/providers/opencode");
const providersPath = joinUrl(env.getApiUrl(), "/api/providers");
const sessionsPath = joinUrl(env.getApiUrl(), "/api/sessions");

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${basePath}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init?.headers },
  });
}

async function sessionRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${sessionsPath}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init?.headers },
  });
}

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined) params.set(key, String(value));
  const value = params.toString();
  return value ? `?${value}` : "";
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const providerApi = {
  getSession: (id: string, directory?: string) =>
    request(`/sessions/${encodeURIComponent(id)}${query({ directory })}`),
  listSessions: (directory?: string, limit?: number) =>
    request(`/sessions${query({ directory, limit })}`),
  children: (id: string, directory?: string) =>
    request(
      `/sessions/${encodeURIComponent(id)}/children${query({ directory })}`,
    ),
  sessionStatuses: (directory?: string) =>
    request(`/sessions/status${query({ directory })}`),
  messages: (id: string, limit?: number, before?: string) =>
    request(
      `/sessions/${encodeURIComponent(id)}/messages${query({ limit, before })}`,
    ),
  createSession: (body: unknown) =>
    request("/sessions", { ...jsonInit(body), method: "POST" }),
  updateSession: (id: string, body: unknown) =>
    request(`/sessions/${encodeURIComponent(id)}`, {
      ...jsonInit(body),
      method: "PATCH",
    }),
  deleteSession: (id: string, directory?: string) =>
    request(`/sessions/${encodeURIComponent(id)}${query({ directory })}`, {
      method: "DELETE",
    }),
  fork: (id: string, body: unknown) =>
    request(`/sessions/${encodeURIComponent(id)}/fork`, jsonInit(body)),
  abort: (id: string, directory?: string) =>
    request(
      `/sessions/${encodeURIComponent(id)}/abort${query({ directory })}`,
      jsonInit({}),
    ),
  sendMessage: (body: unknown) => request("/messages", jsonInit(body)),
  permissions: (directory?: string) =>
    request(`/permissions${query({ directory })}`),
  questions: (directory?: string, sessionId?: string) =>
    request(`/questions${query({ directory, sessionId })}`),
  interaction: (body: unknown) => request("/interactions", jsonInit(body)),
  catalog: () =>
    fetch(providersPath, {
      credentials: "include",
      headers: { Accept: "application/json" },
    }),
  files: (directory: string, path: string) =>
    request(`/files${query({ directory, path })}`),
  readFile: (directory: string, path: string) =>
    request(`/file${query({ directory, path })}`),
  searchFiles: (directory: string, queryValue: string, limit?: number) =>
    request(`/file-search${query({ directory, query: queryValue, limit })}`),
  diff: (directory: string) => request(`/diff${query({ directory })}`),
  commands: (directory: string) => request(`/commands${query({ directory })}`),
};

export const sessionApi = {
  get: (id: string) => sessionRequest(`/${encodeURIComponent(id)}`),
  list: (directory?: string, limit?: number) =>
    sessionRequest(query({ directory, limit })),
  children: (id: string) =>
    sessionRequest(`/${encodeURIComponent(id)}/children`),
  status: (id: string) => sessionRequest(`/${encodeURIComponent(id)}/status`),
  messages: (id: string, limit?: number, before?: string) =>
    sessionRequest(
      `/${encodeURIComponent(id)}/messages${query({ limit, before })}`,
    ),
  questions: (id: string) =>
    sessionRequest(`/${encodeURIComponent(id)}/questions`),
  replyQuestion: (id: string, questionId: string, value: unknown) =>
    sessionRequest(
      `/${encodeURIComponent(id)}/questions/${encodeURIComponent(questionId)}`,
      jsonInit({ value }),
    ),
  create: (body: unknown) => sessionRequest("", jsonInit(body)),
  update: (id: string, body: unknown) =>
    sessionRequest(`/${encodeURIComponent(id)}`, {
      ...jsonInit(body),
      method: "PATCH",
    }),
  delete: (id: string) =>
    sessionRequest(`/${encodeURIComponent(id)}`, { method: "DELETE" }),
  fork: (id: string, body: unknown) =>
    sessionRequest(`/${encodeURIComponent(id)}/fork`, jsonInit(body)),
  abort: (id: string) =>
    sessionRequest(`/${encodeURIComponent(id)}/abort`, jsonInit({})),
  executeCommand: (id: string, body: unknown) =>
    sessionRequest(`/${encodeURIComponent(id)}/command`, jsonInit(body)),
  sendMessage: (id: string, body: unknown) =>
    sessionRequest(`/${encodeURIComponent(id)}/messages`, jsonInit(body)),
};
