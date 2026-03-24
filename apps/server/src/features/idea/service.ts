import { status } from 'elysia'
import { IdeaModel } from './model'
import { resourceConfig } from '../../config'
import { readdir } from "node:fs/promises";
import path from "node:path";
import matter from 'gray-matter';

function parseIdeaFrontMatter(markdown: string, fallbackTitle?: string): { meta: IdeaModel['metaDto']; content: string } {
    const { data, content } = matter(markdown);

    return {
        meta: {
            title: data.title ?? fallbackTitle,
            tags: Array.isArray(data.tags) ? data.tags : [],
            status: data.status ?? 'draft',
            priority: data.priority ?? 'medium',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        },
        content,
    };
}

export abstract class Idea {

    private static async getIndexFiles(): Promise<string[]> {
        const indexFiles: string[] = [];
        const allPaths = await readdir(resourceConfig.idea, { recursive: true });

        const subfolders = new Set<string>();
        for (const filePath of allPaths) {
            if (typeof filePath !== 'string' || filePath.endsWith('/')) continue;
            const parts = filePath.split('/').filter(Boolean);
            if (parts.length >= 1) {
                subfolders.add(parts[0]);
            }
        }

        for (const folder of subfolders) {
            const folderPath = path.join(resourceConfig.idea, folder);
            const indexPath = path.join(folderPath, 'index.md');
            const indexFile = Bun.file(indexPath);
            if (await indexFile.exists()) {
                indexFiles.push(`${folder}/index.md`);
            }
        }

        return indexFiles;
    }

    static async getFiles(): Promise<IdeaModel["fileListDto"]> {
        const files: { name: string; path: string }[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                const name = filePath.split('/')[0];
                files.push({ name, path: filePath });
            }

        } catch (e) {
            throw status(404, 'Idea directory not found');
        }

        return { source: 'idea', files };
    }
    static async getFile(filePath: string): Promise<IdeaModel["fileDto"]> {
        const fullPath = `${resourceConfig.idea}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies IdeaModel["fileNotFound"]);
        }

        const content = await file.text();
        const name = filePath.split('/').pop() || '';

        return { name, path: filePath, content };
    }

    static async getIdea(filePath: string): Promise<IdeaModel["ideaDto"]> {
        const fullPath = `${resourceConfig.idea}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies IdeaModel["fileNotFound"]);
        }

        const content = await file.text();
        const parts = filePath.split('/');
        const name = parts[0];
        const parsed = parseIdeaFrontMatter(content, name);

        return {
            name,
            path: filePath,
            content: parsed.content,
            meta: {
                title: parsed.meta.title || name,
                tags: parsed.meta.tags || [],
                status: parsed.meta.status || 'draft',
                priority: parsed.meta.priority || 'medium',
                createdAt: parsed.meta.createdAt,
                updatedAt: parsed.meta.updatedAt,
            },
        };
    }

    private static matchesFilter(idea: IdeaModel["ideaDto"], filters?: IdeaModel["querySchema"]): boolean {
        if (!filters) return true;

        if (filters.q) {
            const query = filters.q.toLowerCase();
            const matchTitle = idea.meta.title?.toLowerCase().includes(query);
            const matchContent = idea.content.toLowerCase().includes(query);
            const matchTags = idea.meta.tags.some(t => t.toLowerCase().includes(query));
            if (!matchTitle && !matchContent && !matchTags) return false;
        }

        if (filters.tags?.length) {
            if (!filters.tags.some(t => idea.meta.tags.includes(t))) return false;
        }

        if (filters.status && idea.meta.status !== filters.status) return false;
        if (filters.priority && idea.meta.priority !== filters.priority) return false;

        return true;
    }

    static async listIdeas(filters?: IdeaModel["querySchema"]): Promise<IdeaModel["ideaDto"][]> {
        const ideas: IdeaModel["ideaDto"][] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                try {
                    const idea = await this.getIdea(filePath);
                    if (this.matchesFilter(idea, filters)) {
                        ideas.push(idea);
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
                ideas.sort((a, b) => {
                    const aTime = a.meta.updatedAt ? new Date(a.meta.updatedAt).getTime() : 0;
                    const bTime = b.meta.updatedAt ? new Date(b.meta.updatedAt).getTime() : 0;
                    return (aTime - bTime) * dir;
                });
            }
        }

        return ideas;
    }
}
