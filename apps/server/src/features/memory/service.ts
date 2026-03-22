import { status } from 'elysia'
import { MemoryModel } from './model'
import { resourceConfig } from '../../config'
import { readdir } from "node:fs/promises";
import { parseFrontMatter } from '../../lib/front-matter';

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
        const parsed = parseFrontMatter(content, name);

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

        return memories;
    }
}
