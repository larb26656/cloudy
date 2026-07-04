export type ArtifactType = 'html' | 'pdf' | 'image' | 'video' | 'document';
export type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
export type IdeaPriority = 'low' | 'medium' | 'high';

export interface ArtifactMeta extends MemoryMeta {
  type?: ArtifactType;
}

export interface IdeaMeta extends MemoryMeta {
  status?: IdeaStatus;
  priority?: IdeaPriority;
}

export interface MemoryMeta {
  title?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export function stringifyFrontMatter(meta: MemoryMeta, content: string): string {
  const parts: string[] = ['---'];

  if (meta.title) {
    parts.push(`title: "${meta.title}"`);
  }

  if (meta.tags && meta.tags.length > 0) {
    parts.push(`tags: [${meta.tags.map((t) => `"${t}"`).join(', ')}]`);
  }

  if (meta.createdAt) {
    parts.push(`createdAt: ${meta.createdAt}`);
  }

  if (meta.updatedAt) {
    parts.push(`updatedAt: ${meta.updatedAt}`);
  }

  parts.push('---\n');

  return parts.join('\n') + content;
}

export function stringifyIdeaFrontMatter(meta: IdeaMeta, content: string): string {
  const frontMeta: MemoryMeta = {
    title: meta.title,
    tags: meta.tags,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
  const base = stringifyFrontMatter(frontMeta, content);
  const lines = base.split('\n');
  const dashIndex = lines.indexOf('---', 1);
  if (dashIndex !== -1) {
    if (meta.status) lines.splice(dashIndex, 0, `status: ${meta.status}`);
    if (meta.priority) lines.splice(dashIndex + (meta.status ? 1 : 0), 0, `priority: ${meta.priority}`);
  }
  return lines.join('\n');
}
