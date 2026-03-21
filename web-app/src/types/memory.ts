export interface Memory {
  id: string;
  name: string;
  content: string;
  markdown: string;
  tags: string[];
  created: Date;
  updated: Date;
}

export interface Idea {
  id: string;
  name: string;
  description: string;
  markdown: string;
  tags: string[];
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  created: Date;
  updated: Date;
}
