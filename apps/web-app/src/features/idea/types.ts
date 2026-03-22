import type { IdeaModel } from "@cloudy/contracts";

export type IdeaStatus = IdeaModel['ideaStatus'];
export type IdeaPriority = IdeaModel['ideaPriority'];

export type Idea = {
  id: string;
  name: string;
  description: string;
  markdown: string;
  meta: {
    title?: string;
    tags: string[];
    status: IdeaStatus;
    priority: IdeaPriority;
    createdAt: string;
    updatedAt: string;
  };
};
