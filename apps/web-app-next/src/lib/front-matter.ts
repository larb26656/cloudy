export interface FrontMatterMeta {
  title?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ArtifactType = 'html' | 'pdf' | 'image' | 'video' | 'document';
export type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
export type IdeaPriority = 'low' | 'medium' | 'high';

export interface ArtifactFrontMatterMeta extends FrontMatterMeta {
  type?: ArtifactType;
}

export interface IdeaFrontMatterMeta extends FrontMatterMeta {
  status?: IdeaStatus;
  priority?: IdeaPriority;
}

export interface ParsedMarkdown {
  meta: FrontMatterMeta;
  content: string;
  raw: string;
}

export function parseFrontMatter(markdown: string, fallbackTitle?: string): ParsedMarkdown {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = markdown.match(frontMatterRegex);

  if (!match) {
    return {
      meta: {
        title: fallbackTitle,
        tags: [],
      },
      content: markdown,
      raw: markdown,
    };
  }

  const metaString = match[1];
  const content = markdown.slice(match[0].length);
  const meta: FrontMatterMeta = {
    title: fallbackTitle,
    tags: [],
  };

  for (const line of metaString.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    switch (key) {
      case 'title':
        meta.title = value || fallbackTitle;
        break;
      case 'tags':
        try {
          if (value.startsWith('[')) {
            meta.tags = JSON.parse(value.replace(/'/g, '"'));
          } else {
            meta.tags = value.split(',').map((t) => t.trim()).filter(Boolean);
          }
        } catch {
          meta.tags = [];
        }
        break;
      case 'createdAt':
      case 'updatedAt':
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          meta[key] = value;
        }
        break;
    }
  }

  return { meta, content, raw: markdown };
}

export function parseIdeaFrontMatter(markdown: string, fallbackTitle?: string): {
  meta: IdeaFrontMatterMeta;
  content: string;
  raw: string;
} {
  const parsed = parseFrontMatter(markdown, fallbackTitle);
  const meta: IdeaFrontMatterMeta = { ...parsed.meta };

  const statusMatch = parsed.raw.match(/^---\n([\s\S]*?)\n---/m);
  if (statusMatch) {
    for (const line of statusMatch[1].split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      if (key === 'status' && ['draft', 'in-progress', 'completed', 'archived'].includes(value)) {
        meta.status = value as IdeaStatus;
      }
      if (key === 'priority' && ['low', 'medium', 'high'].includes(value)) {
        meta.priority = value as IdeaPriority;
      }
    }
  }

  return { ...parsed, meta };
}

export function parseArtifactFrontMatter(markdown: string, fallbackTitle?: string): {
  meta: ArtifactFrontMatterMeta;
  content: string;
  raw: string;
} {
  const parsed = parseFrontMatter(markdown, fallbackTitle);
  const meta: ArtifactFrontMatterMeta = { ...parsed.meta };

  const frontMatterMatch = parsed.raw.match(/^---\n([\s\S]*?)\n---/m);
  if (frontMatterMatch) {
    for (const line of frontMatterMatch[1].split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      if (key === 'type' && ['html', 'pdf', 'image', 'video', 'document'].includes(value)) {
        meta.type = value as ArtifactType;
      }
    }
  }

  return { ...parsed, meta };
}

export function stringifyFrontMatter(meta: FrontMatterMeta, content: string): string {
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

export function stringifyArtifactFrontMatter(meta: ArtifactFrontMatterMeta, content: string): string {
  const frontMeta: FrontMatterMeta = {
    title: meta.title,
    tags: meta.tags,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
  const base = stringifyFrontMatter(frontMeta, content);
  const lines = base.split('\n');
  const dashIndex = lines.indexOf('---', 1);
  if (dashIndex !== -1) {
    if (meta.type) lines.splice(dashIndex, 0, `type: ${meta.type}`);
  }
  return lines.join('\n');
}

export function stringifyIdeaFrontMatter(meta: IdeaFrontMatterMeta, content: string): string {
  const frontMeta: FrontMatterMeta = {
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
