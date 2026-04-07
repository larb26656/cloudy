import { env } from "./env";

function getAuthHeader(): Record<string, string> {
  const username = env.CLOUDY_API_USERNAME;
  const password = env.CLOUDY_API_PASSWORD;
  if (!username && !password) return {};
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

async function ideaApi(path: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  const res = await fetch(`${env.CLOUDY_API_BASE_PATH}/api/idea${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    signal: controller.signal,
    ...options,
  });

  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

export async function listIdeas(query?: string) {
  return ideaApi(query ? `?${query}` : "");
}

export async function getIdea(ideaPath: string) {
  return ideaApi(`/${encodeURIComponent(ideaPath)}`);
}

export async function createIdea(body: {
  title: string;
  content?: string;
  tags?: string[];
  status?: string;
  priority?: string;
}) {
  return ideaApi("", { method: "POST", body: JSON.stringify(body) });
}

export async function updateIdeaMeta(
  ideaPath: string,
  body: {
    title?: string;
    tags?: string[];
    status?: string;
    priority?: string;
  },
) {
  return ideaApi(`/${encodeURIComponent(ideaPath)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteIdea(ideaPath: string) {
  return ideaApi(`/${encodeURIComponent(ideaPath)}`, { method: "DELETE" });
}

export async function touchIdea(ideaPath: string) {
  return ideaApi(`/${encodeURIComponent(ideaPath)}/touch`, { method: "PATCH" });
}
