import type { InferResponseType } from "hono/client";
import type { cloudyClient } from "@/lib/api";

type CloudyClient = typeof cloudyClient;

export type MemoryDto = InferResponseType<
  CloudyClient["api"]["memory"]["$get"],
  200
>[number];

export type Memory = {
  id: string;
  name: string;
  markdown: string;
  description: string;
  meta: {
    title?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
};
