import { env } from "./env";

async function ideaApi(path: string, options?: RequestInit) {
  const res = await fetch(`${env.CLOUDY_API_BASE_PATH}/api/idea${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

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
