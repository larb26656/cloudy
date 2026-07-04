import type { InferResponseType } from "hono/client";
import type { cloudyClient } from "@/lib/api";

type CloudyClient = typeof cloudyClient;

export type ArtifactDto = InferResponseType<
  CloudyClient["api"]["artifact"]["$get"],
  200
>[number];

export type ArtifactType = ArtifactDto["meta"]["type"];

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
