import type { InferResponseType } from "hono/client";
import type { cloudyClient } from "@/lib/api";

type CloudyClient = typeof cloudyClient;

export type IdeaListItemDto = InferResponseType<
  CloudyClient["api"]["idea"]["$get"],
  200
>[number];
export type IdeaDetailDto = InferResponseType<
  CloudyClient["api"]["idea"][":path"]["$get"],
  200
>;

export type IdeaStatus = IdeaListItemDto["meta"]["status"];
export type IdeaPriority = IdeaListItemDto["meta"]["priority"];

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
    createdAt: string;
    updatedAt: string;
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
  data: IdeaListItemDto,
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
  data: IdeaDetailDto,
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

