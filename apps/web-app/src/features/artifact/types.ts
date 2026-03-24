import type { ArtifactModel } from "@cloudy/contracts";

export type ArtifactType = ArtifactModel['artifactType'];

export type Artifact = {
  id: string;
  name: string;
  fileName: string;
  description: string;
  markdown: string;
  meta: {
    title?: string;
    tags: string[];
    type: ArtifactType;
    createdAt: string;
    updatedAt: string;
  };
};
