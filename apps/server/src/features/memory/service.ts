import { status } from 'elysia'
import { MemoryModel } from './model'
import { resourceConfig } from '../../config'
import { readdir } from "node:fs/promises";
import matter from 'gray-matter';

function isDateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(str);
}

function parseMemoryFrontMatter(markdown: string, fallbackTitle?: string): { meta: MemoryModel['metaDto']; content: string } {
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

export abstract class Memory {

    private static async getIndexFiles(): Promise<string[]> {
        const indexFiles: string[] = [];
        const allPaths = await readdir(resourceConfig.memory, { recursive: true });

        for (const filePath of allPaths) {
            if (typeof filePath !== 'string') continue;
            if (filePath.endsWith('/')) continue;
            if (!filePath.endsWith('.md')) continue;
            indexFiles.push(filePath);
        }

        return indexFiles;
    }

    static async getFiles(): Promise<MemoryModel["fileListDto"]> {
        const files: { name: string; path: string }[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                const name = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
                files.push({ name, path: filePath });
            }

        } catch (e) {
            throw status(404, 'Memory directory not found');
        }

        return { source: 'memory', files };
    }
    static async getFile(filePath: string): Promise<MemoryModel["fileDto"]> {
        const fullPath = `${resourceConfig.memory}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies MemoryModel["fileNotFound"]);
        }

        const content = await file.text();
        const name = filePath.split('/').pop() || '';

        return { name, path: filePath, content };
    }

    static async getMemory(filePath: string): Promise<MemoryModel["memoryDto"]> {
        const fullPath = `${resourceConfig.memory}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies MemoryModel["fileNotFound"]);
        }

        const content = await file.text();
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

    private static matchesFilter(memory: MemoryModel["memoryDto"], filters?: MemoryModel["querySchema"]): boolean {
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

    static async listMemories(filters?: MemoryModel["querySchema"]): Promise<MemoryModel["memoryDto"][]> {
        const memories: MemoryModel["memoryDto"][] = [];

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
