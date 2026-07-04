import { stringifyFrontMatter } from "@/lib/front-matter";
import { toISOString } from "@/lib/date";
import type { Memory, MemoryDto } from "@/features/memory/types";

export function apiResponseToMemory(data: MemoryDto): Memory {
  const meta = data.meta;

  return {
    id: data.path,
    name: data.name,
    markdown: stringifyFrontMatter({
      title: meta.title,
      tags: meta.tags,
      createdAt: toISOString(meta.createdAt),
      updatedAt: toISOString(meta.updatedAt),
    }, data.content),
    description: data.content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || data.name,
    meta: {
      title: meta.title || data.name,
      tags: meta.tags || [],
      createdAt: toISOString(meta.createdAt),
      updatedAt: toISOString(meta.updatedAt),
    },
  };
}
