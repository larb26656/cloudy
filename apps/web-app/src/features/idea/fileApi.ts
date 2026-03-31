import { env } from "@/config/env";
import type { Idea } from "@/features/idea/types";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${env.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function getIdeaFile(ideaPath: string, filename: string): Promise<{ 
  name: string; 
  path: string; 
  content: string;
  meta: Idea['meta'];
}> {
  return fetchApi(`/api/idea/${ideaPath}/file/${filename}`);
}

export async function createIdeaFile(ideaPath: string, filename: string, content?: string): Promise<{ name: string; path: string; content: string }> {
  return fetchApi(`/api/idea/${ideaPath}/file`, {
    method: 'POST',
    body: JSON.stringify({ filename, content }),
  });
}

export async function updateIdeaFile(ideaPath: string, filename: string, content: string): Promise<{ name: string; path: string; content: string }> {
  return fetchApi(`/api/idea/${ideaPath}/file/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function deleteIdeaFile(ideaPath: string, filename: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/idea/${ideaPath}/file/${filename}`, {
    method: 'DELETE',
  });
}

export async function patchIdeaMeta(ideaPath: string, updates: {
  status?: 'draft' | 'in-progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  title?: string;
  tags?: string[];
}): Promise<Idea> {
  return fetchApi(`/api/idea/${ideaPath}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
