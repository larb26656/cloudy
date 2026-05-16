import { IdeaModel } from './model'
import { IdeaRepository } from './repository';
import { IdeaFile } from './file/service';
import { IDEA_INDEX_FILE } from './types';
import type { IdeaQuery } from './types';

export function generateIdeaPath(title: string): string {
    const timestamp = Date.now();
    const slug = title
        ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : '';
    return slug ? `${timestamp}_${slug}` : `${timestamp}`;
}

export class Idea {
    protected repository: IdeaRepository;
    protected ideaFile: IdeaFile;

    constructor(repository: IdeaRepository, ideaFile: IdeaFile) {
        this.repository = repository;
        this.ideaFile = ideaFile;
    }

    async createIdea(
        input: z.infer<typeof IdeaModel.ideaCreateDto>,
    ): Promise<z.infer<typeof IdeaModel.ideaDetailDto>> {
        const ideaPath = generateIdeaPath(input.title);
        const title = input.title ?? ideaPath;

        await this.ideaFile.createIdeaDirectory(ideaPath, input.content);

        await this.repository.create({
            id: ideaPath,
            title,
            tags: input.tags ?? [],
            status: input.status ?? 'draft',
            priority: input.priority ?? 'medium',
            path: ideaPath,
        });

        return await this.getIdea(ideaPath);
    }

    async deleteIdea(ideaPath: string): Promise<{ success: boolean }> {
        const exists = await this.repository.exists(ideaPath);
        if (!exists) {
            throw new Response('Idea not found', { status: 404 });
        }

        await this.ideaFile.deleteIdeaDirectory(ideaPath);

        await this.repository.deleteByPath(ideaPath);

        return { success: true };
    }

    async patchMeta(ideaPath: string, updates: z.infer<typeof IdeaModel.ideaMetaUpdateDto>): Promise<z.infer<typeof IdeaModel.ideaDetailDto>> {
        const existing = await this.repository.findByPath(ideaPath);

        if (!existing) {
            throw new Response('File not found', { status: 404 });
        }

        await this.repository.updateByPath(ideaPath, {
            title: updates.title,
            tags: updates.tags,
            status: updates.status,
            priority: updates.priority,
        });

        return await this.getIdea(ideaPath);
    }

    async getIdea(ideaPath: string): Promise<z.infer<typeof IdeaModel.ideaDetailDto>> {
        const record = await this.repository.findByPath(ideaPath);

        if (!record) {
            throw new Response('File not found', { status: 404 });
        }

        const file = await this.ideaFile.getFile(ideaPath, IDEA_INDEX_FILE);
        const files = await this.ideaFile.listIdeaFiles(ideaPath);

        return {
            title: record.title,
            path: ideaPath,
            content: file.content,
            files,
            meta: {
                title: record.title || ideaPath,
                tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags || [],
                status: record.status,
                priority: record.priority,
                createdAt: new Date(record.createdAt),
                updatedAt: new Date(record.updatedAt),
            },
        };
    }

    async touchUpdatedAt(ideaPath: string): Promise<void> {
        const exists = await this.repository.exists(ideaPath);
        if (!exists) {
            throw new Response('Idea not found', { status: 404 });
        }

        await this.repository.touchUpdatedAt(ideaPath);
    }

    async listIdeas(filters?: z.infer<typeof IdeaModel.querySchema>): Promise<z.infer<typeof IdeaModel.ideaDto>[]> {
        const query: IdeaQuery = {
            q: filters?.q,
            tags: filters?.tags,
            status: filters?.status,
            priority: filters?.priority,
            order: filters?.order,
        };

        const ideas = await this.repository.findAll(query);

        const result: z.infer<typeof IdeaModel.ideaDto>[] = [];

        for (const record of ideas) {
            try {
                const file = await this.ideaFile.getFile(record.path, IDEA_INDEX_FILE);

                result.push({
                    title: record.title,
                    path: record.path,
                    content: file.content,
                    meta: {
                        title: record.title || record.path,
                        tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags || [],
                        status: record.status,
                        priority: record.priority,
                        createdAt: new Date(record.createdAt),
                        updatedAt: new Date(record.updatedAt),
                    },
                });
            } catch (err) {
                console.log(err)

                continue;
            }
        }

        return result;
    }
}

import { z } from 'zod'