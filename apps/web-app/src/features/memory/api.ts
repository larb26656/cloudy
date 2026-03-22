import type { MemoryModel } from "@cloudy/contracts";
import { stringifyFrontMatter } from "@/lib/front-matter";
import { toISOString } from "@/lib/date";
import type { Memory } from "@/features/memory/types";

export function apiResponseToMemory(data: MemoryModel['memoryDto']): Memory {
  const meta = data.meta;

  return {
    id: data.path,
    name: data.name,
    markdown: stringifyFrontMatter(meta, data.content),
    description: data.content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || data.name,
    meta: {
      title: meta.title || data.name,
      tags: meta.tags || [],
      createdAt: toISOString(meta.createdAt),
      updatedAt: toISOString(meta.updatedAt),
    },
  };
}
