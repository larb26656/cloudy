export interface MemoryMeta {
  title?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  name: string;
  content: string;
  markdown: string;
  meta: MemoryMeta;
}

export type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
export type IdeaPriority = 'low' | 'medium' | 'high';

export interface IdeaMeta {
  title?: string;
  tags: string[];
  status: IdeaStatus;
  priority: IdeaPriority;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  name: string;
  description: string;
  markdown: string;
  meta: IdeaMeta;
}
