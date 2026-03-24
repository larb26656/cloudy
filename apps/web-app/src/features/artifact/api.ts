import type { ArtifactModel } from "@cloudy/contracts";
import { stringifyArtifactFrontMatter } from "@/lib/front-matter";
import { toISOString } from "@/lib/date";
import type { Artifact } from "@/features/artifact/types";

export function apiResponseToArtifact(data: ArtifactModel['artifactDto']): Artifact {
  const now = new Date().toISOString();
  const meta = data.meta;

  return {
    id: data.path,
    name: meta.title || data.name,
    markdown: stringifyArtifactFrontMatter({
      ...meta,
      createdAt: toISOString(meta.createdAt),
      updatedAt: toISOString(meta.updatedAt),
    }, data.content),
    description: data.content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || data.name,
    meta: {
      title: meta.title || data.name,
      tags: meta.tags || [],
      type: meta.type,
      createdAt: meta.createdAt ? new Date(meta.createdAt).toISOString() : now,
      updatedAt: meta.updatedAt ? new Date(meta.updatedAt).toISOString() : now,
    },
  };
}
