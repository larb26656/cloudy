import { env } from "@/config/env";

const basePath = `${env.getApiUrl()}/api/providers/opencode`;
const providersPath = `${env.getApiUrl()}/api/providers`;

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${basePath}${path}`, {
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
  executeCommand: (body: unknown) => request("/command", jsonInit(body)),
};
