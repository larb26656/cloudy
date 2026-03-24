import type { ArtifactModel } from "@cloudy/contracts";
import { stringifyArtifactFrontMatter } from "@/lib/front-matter";
import type { Artifact } from "@/features/artifact/types";

export function apiResponseToArtifact(data: ArtifactModel['artifactDto']): Artifact {
  const now = new Date().toISOString();
  const meta = data.meta;

  return {
    id: data.path,
    name: data.name,
    markdown: stringifyArtifactFrontMatter(meta, data.content),
    description: data.content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || data.name,
    meta: {
      title: meta.title || data.name,
      tags: meta.tags || [],
      type: meta.type,
      createdAt: meta.createdAt || now,
      updatedAt: meta.updatedAt || now,
    },
  };
}
