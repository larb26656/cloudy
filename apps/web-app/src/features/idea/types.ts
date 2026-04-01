import type { IdeaModel } from "@cloudy/contracts";

export type IdeaStatus = IdeaModel['ideaStatus'];
export type IdeaPriority = IdeaModel['ideaPriority'];

export type IdeaFile = {
  name: string;
  path: string;
  size: number;
  updatedAt?: string;
};

export type Idea = {
  id: string;
  name: string;
  path: string;
  description: string;
  meta: {
    title?: string;
    tags: string[];
    status: IdeaStatus;
    priority: IdeaPriority;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type IdeaDetail = {
  id: string;
  name: string;
  path: string;
  content: string;
  files: IdeaFile[];
  meta: {
    title?: string;
    tags: string[];
    status: IdeaStatus;
    priority: IdeaPriority;
    createdAt?: string;
    updatedAt?: string;
  };
};

export function apiResponseToIdeaListItem(
  data: IdeaModel["ideaDto"],
): Idea {
  const now = new Date().toISOString();
  const meta = data.meta;
  const path = data.path;

  return {
    id: data.path,
    name: data.title,
    path,
    description:
      data.content.split("\n")[0]?.replace(/^#+\s*/, "").trim() ||
      data.title,
    meta: {
      title: data.title,
      tags: meta.tags || [],
      status: meta.status,
      priority: meta.priority,
      createdAt: meta.createdAt
        ? new Date(meta.createdAt).toISOString()
        : now,
      updatedAt: meta.updatedAt
        ? new Date(meta.updatedAt).toISOString()
        : now,
    },
  };
}

export function apiResponseToIdeaDetail(
  data: IdeaModel["ideaDetailDto"],
): IdeaDetail {
  const now = new Date().toISOString();
  const meta = data.meta;
  const path = data.path;

  console.log(data);

  return {
    id: data.path,
    name: data.title,
    path,
    content: data.content,
    files: data.files.map((f) => ({
      name: f.name,
      path: f.path,
      size: f.size,
      updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : undefined,
    })),
    meta: {
      title: data.title,
      tags: meta.tags || [],
      status: meta.status,
      priority: meta.priority,
      createdAt: meta.createdAt
        ? new Date(meta.createdAt).toISOString()
        : now,
      updatedAt: meta.updatedAt
        ? new Date(meta.updatedAt).toISOString()
        : now,
    },
  };
}

