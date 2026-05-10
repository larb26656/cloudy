import { z } from 'zod'
import type { CloudyConfig } from '../../config'
import { readdir, stat, access } from "node:fs/promises";
import path from "node:path";
import matter from 'gray-matter';

function isDateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(str);
}

function parseMemoryFrontMatter(markdown: string, fallbackTitle?: string): { meta: { title?: string; tags: string[]; createdAt?: Date; updatedAt?: Date }; content: string } {
    try {
        const { data, content } = matter(markdown);
        const title = data.title && typeof data.title === 'string' && !isDateString(data.title)
            ? data.title
            : fallbackTitle;

        return {
            meta: {
                title,
                tags: Array.isArray(data.tags) ? data.tags : [],
                createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
                updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
            },
            content,
        };
    } catch {
        return {
            meta: {
                title: fallbackTitle,
                tags: [],
            },
            content: markdown,
        };
    }
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

export class Memory {
    private memoryPath: string;

    constructor(private config: CloudyConfig) {
        this.memoryPath = config.memory;
    }

    private async getIndexFiles(): Promise<string[]> {
        const indexFiles: string[] = [];
        const allPaths = await readdir(this.memoryPath, { recursive: true });

        for (const filePath of allPaths) {
            if (typeof filePath !== 'string') continue;
            if (filePath.endsWith('/')) continue;
            if (!filePath.endsWith('.md')) continue;
            indexFiles.push(filePath);
        }

        return indexFiles;
    }

    async getFiles(): Promise<{ source: 'memory'; files: { name: string; path: string }[] }> {
        const files: { name: string; path: string }[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                const name = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
                files.push({ name, path: filePath });
            }

        } catch {
            throw new Response('Memory directory not found', { status: 404 });
        }

        return { source: 'memory', files };
    }

    async getFile(filePath: string): Promise<{ name: string; path: string; content: string }> {
        const fullPath = `${this.memoryPath}/${filePath}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        const { readFile } = await import('node:fs/promises');
        const content = await readFile(fullPath, 'utf-8');
        const name = filePath.split('/').pop() || '';

        return { name, path: filePath, content };
    }

    async getMemory(filePath: string): Promise<{ name: string; path: string; content: string; meta: { title?: string; tags: string[]; createdAt?: Date; updatedAt?: Date } }> {
        const fullPath = `${this.memoryPath}/${filePath}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        const { readFile } = await import('node:fs/promises');
        const content = await readFile(fullPath, 'utf-8');
        const name = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
        const parsed = parseMemoryFrontMatter(content, name);

        return {
            name,
            path: filePath,
            content: parsed.content,
            meta: {
                title: parsed.meta.title || name,
                tags: parsed.meta.tags || [],
                createdAt: parsed.meta.createdAt,
                updatedAt: parsed.meta.updatedAt,
            },
        };
    }

    private matchesFilter(memory: { content: string; meta: { title?: string; tags: string[] } }, filters?: { q?: string; tags?: string[]; order?: string }): boolean {
        if (!filters) return true;

        if (filters.q) {
            const query = filters.q.toLowerCase();
            const matchTitle = memory.meta.title?.toLowerCase().includes(query);
            const matchContent = memory.content.toLowerCase().includes(query);
            const matchTags = memory.meta.tags.some(t => t.toLowerCase().includes(query));
            if (!matchTitle && !matchContent && !matchTags) return false;
        }

        if (filters.tags?.length) {
            if (!filters.tags.some(t => memory.meta.tags.includes(t))) return false;
        }

        return true;
    }

    async listMemories(filters?: { q?: string; tags?: string[]; order?: string }): Promise<{ name: string; path: string; content: string; meta: { title?: string; tags: string[]; createdAt?: Date; updatedAt?: Date } }[]> {
        const memories: { name: string; path: string; content: string; meta: { title?: string; tags: string[]; createdAt?: Date; updatedAt?: Date } }[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                try {
                    const memory = await this.getMemory(filePath);
                    if (this.matchesFilter(memory, filters)) {
                        memories.push(memory);
                    }
                } catch {
                    continue;
                }
            }
        } catch {
            console.error('Error listing memories')
            return [];
        }

        if (filters?.order) {
            const [field, direction] = filters.order.split(':');
            if (field === 'updatedAt') {
                const dir = direction === 'asc' ? 1 : -1;
                memories.sort((a, b) => {
                    const aTime = a.meta.updatedAt ? new Date(a.meta.updatedAt).getTime() : 0;
                    const bTime = b.meta.updatedAt ? new Date(b.meta.updatedAt).getTime() : 0;
                    return (aTime - bTime) * dir;
                });
            }
        }

        return memories;
    }
}