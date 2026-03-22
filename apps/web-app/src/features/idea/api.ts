import type { IdeaModel } from "@cloudy/contracts";
import { stringifyIdeaFrontMatter } from "@/lib/front-matter";
import type { Idea } from "@/features/idea/types";

export function apiResponseToIdea(data: IdeaModel['ideaDto']): Idea {
  const now = new Date().toISOString();
  const meta = data.meta;

  return {
    id: data.path,
    name: data.name,
    markdown: stringifyIdeaFrontMatter(meta, data.content),
    description: data.content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || data.name,
    meta: {
      title: meta.title || data.name,
      tags: meta.tags || [],
      status: meta.status,
      priority: meta.priority,
      createdAt: meta.createdAt || now,
      updatedAt: meta.updatedAt || now,
    },
  };
}
