import { status } from 'elysia'
import { MemoryModel } from './model'
import { resourceConfig } from '../../config'
import { parseFrontMatter } from '../../lib/front-matter'

export abstract class Memory {

    static async getFiles(): Promise<MemoryModel["fileListDto"]> {
        const dir = Bun.file(resourceConfig.memory);

        if (!await dir.exists()) {
            throw status(404, 'Memory directory not found');
        }

        const files: { name: string; path: string }[] = [];
        const directory = Bun.spawn(['find', resourceConfig.memory, '-type', 'f']);
        const output = await new Response(directory.stdout).text();
        const filePaths = output.trim().split('\n').filter(Boolean);

        for (const filePath of filePaths) {
            const relativePath = filePath.replace(resourceConfig.memory + '/', '');
            const name = relativePath.split('/').pop() || '';
            files.push({ name, path: relativePath });
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

    static async listMemories(): Promise<MemoryModel["memoryDto"][]> {
        const dir = Bun.file(resourceConfig.memory);

        if (!await dir.exists()) {
            return [];
        }

        const memories: MemoryModel["memoryDto"][] = [];
        const directory = Bun.spawn(['find', resourceConfig.memory, '-type', 'f', '-name', '*.md']);
        const output = await new Response(directory.stdout).text();
        const filePaths = output.trim().split('\n').filter(Boolean);

        for (const filePath of filePaths) {
            try {
                const relativePath = filePath.replace(resourceConfig.memory + '/', '');
                const memory = await this.getMemory(relativePath);
                memories.push(memory);
            } catch {
                continue;
            }
        }

        return memories;
    }
}
