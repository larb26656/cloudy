import { status } from 'elysia'
import { IdeaModel } from './model'
import { IdeaRepository } from './repository';
import { IdeaFile } from './file/service';
import type { IdeaQuery } from './types';

function generateId(): string {
    return crypto.randomUUID();
}

export class Idea {
    constructor(
        protected repository: IdeaRepository,
        protected ideaFile: IdeaFile,
    ) { }

    async createIdea(ideaPath: string): Promise<IdeaModel["ideaDetailDto"]> {
        const exists = await this.repository.exists(ideaPath);
        if (exists) {
            throw status(400, 'Idea already exists');
        }

        await this.ideaFile.createIdeaDirectory(ideaPath);

        const id = generateId();
        await this.repository.create({
            id,
            title: ideaPath,
            path: `${ideaPath}/index.md`,
            status: 'draft',
            priority: 'medium',
        });

        return await this.getIdea(ideaPath);
    }

    async deleteIdea(ideaPath: string): Promise<{ success: boolean }> {
        const exists = await this.repository.exists(ideaPath);
        if (!exists) {
            throw status(404, 'Idea not found');
        }

        await this.ideaFile.deleteIdeaDirectory(ideaPath);

        await this.repository.deleteByPath(`${ideaPath}/index.md`);

        return { success: true };
    }

    async patchMeta(ideaPath: string, updates: IdeaModel["ideaMetaUpdateDto"]): Promise<IdeaModel["ideaDto"]> {
        const indexPath = `${ideaPath}/index.md`;
        const existing = await this.repository.findByPath(indexPath);

        if (!existing) {
            throw status(404, 'File not found' satisfies IdeaModel["fileNotFound"]);
        }

        await this.repository.updateByPath(indexPath, {
            title: updates.title,
            tags: updates.tags,
            status: updates.status,
            priority: updates.priority,
        });

        return await this.getIdea(ideaPath);
    }

    async getIdea(filePath: string): Promise<IdeaModel["ideaDetailDto"]> {
        const parts = filePath.split('/');
        const name = parts[0];
        const indexPath = `${name}/index.md`;

        const record = await this.repository.findByPath(indexPath);

        if (!record) {
            throw status(404, 'File not found' satisfies IdeaModel["fileNotFound"]);
        }

        const file = await this.ideaFile.getFile(indexPath);
        const files = await this.ideaFile.listIdeaFiles(name);

        return {
            name,
            path: indexPath,
            content: file.content,
            files,
            meta: {
                title: record.title || name,
                tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags || [],
                status: record.status,
                priority: record.priority,
                createdAt: new Date(record.created_at),
                updatedAt: new Date(record.updated_at),
            },
        };
    }

    async listIdeas(filters?: IdeaModel["querySchema"]): Promise<IdeaModel["ideaDto"][]> {
        const query: IdeaQuery = {
            q: filters?.q,
            tags: filters?.tags,
            status: filters?.status,
            priority: filters?.priority,
            order: filters?.order,
        };

        const ideas = await this.repository.findAll(query);

        const result: IdeaModel["ideaDto"][] = [];

        for (const record of ideas) {
            try {
                const file = await this.ideaFile.getFile(record.path);

                result.push({
                    name: record.path.split('/')[0],
                    path: record.path,
                    content: file.content,
                    meta: {
                        title: record.title || record.path.split('/')[0],
                        tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags || [],
                        status: record.status,
                        priority: record.priority,
                        createdAt: new Date(record.created_at),
                        updatedAt: new Date(record.updated_at),
                    },
                });
            } catch {
                continue;
            }
        }

        return result;
    }
}
