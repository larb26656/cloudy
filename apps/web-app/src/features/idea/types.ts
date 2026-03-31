import type { IdeaModel } from "@cloudy/contracts";

export type IdeaStatus = IdeaModel['ideaStatus'];
export type IdeaPriority = IdeaModel['ideaPriority'];

export type IdeaFile = {
  name: string;
  path: string;
  size: number;
  updatedAt?: string;
};

export type Idea = {
  id: string;
  name: string;
  folder: string;
  description: string;
  markdown: string;
  files: IdeaFile[];
  meta: {
    title?: string;
    tags: string[];
    status: IdeaStatus;
    priority: IdeaPriority;
    createdAt: string;
    updatedAt: string;
  };
};
