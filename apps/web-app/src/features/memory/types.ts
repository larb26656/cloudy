import type { MemoryModel } from "@cloudy/contracts";
export type { MemoryModel };

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
