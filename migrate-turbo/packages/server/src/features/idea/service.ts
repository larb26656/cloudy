import { HTTPException } from 'hono/http-exception';
import type { CreateIdeaInput, IdeaDetailDto, IdeaDto, IdeaQuery, UpdateIdeaInput } from './model';
import { IdeaRepository, type IdeaRecord } from './repository';
import { IdeaFile } from './file/service';

export function generateIdeaPath(title: string): string {
    const timestamp = Date.now();
    const slug = title
        ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : '';
    return slug ? `${timestamp}_${slug}` : `${timestamp}`;
}

export class IdeaService {
    constructor(
        private repository: IdeaRepository,
        private ideaFile: IdeaFile
    ) {}

    private recordToDto(record: IdeaRecord, content: string): IdeaDto {
        return {
            title: record.title || record.path,
            path: record.path,
            content,
            meta: {
                title: record.title || record.path,
                tags: record.tags || [],
                status: record.status as IdeaDto['meta']['status'],
                priority: record.priority as IdeaDto['meta']['priority'],
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
            },
        };
    }

    private recordToDetailDto(record: IdeaRecord, content: string, files: { name: string; path: string; size: number; updatedAt?: string }[]): IdeaDetailDto {
        return {
            title: record.title || record.path,
            path: record.path,
            content,
            files,
            meta: {
                title: record.title || record.path,
                tags: record.tags || [],
                status: record.status as IdeaDetailDto['meta']['status'],
                priority: record.priority as IdeaDetailDto['meta']['priority'],
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
            },
        };
    }

    async listIdeas(query?: IdeaQuery): Promise<IdeaDto[]> {
        const records = await this.repository.findAll(query);
        const result: IdeaDto[] = [];

        for (const record of records) {
            try {
                const file = await this.ideaFile.getFile(record.path);
                result.push(this.recordToDto(record, file.content));
            } catch {
                continue;
            }
        }

        return result;
    }

    async getIdea(path: string): Promise<IdeaDetailDto> {
        const record = await this.repository.findByPath(path);

        if (!record) {
            throw new HTTPException(404, { message: `Idea with path ${path} not found` });
        }

        try {
            const file = await this.ideaFile.getFile(path);
            const files = await this.ideaFile.listIdeaFiles(path);
            return this.recordToDetailDto(
                record,
                file.content,
                files.map(f => ({
                    ...f,
                    updatedAt: f.updatedAt?.toISOString(),
                }))
            );
        } catch {
            throw new HTTPException(404, { message: `Idea with path ${path} not found` });
        }
    }

    async createIdea(input: CreateIdeaInput): Promise<IdeaDetailDto> {
        const ideaPath = generateIdeaPath(input.title);
        const title = input.title ?? ideaPath;

        await this.ideaFile.createIdeaDirectory(ideaPath, input.content);

        await this.repository.create({
            ...input,
            id: ideaPath,
            title,
            tags: input.tags ?? [],
            status: input.status ?? 'draft',
            priority: input.priority ?? 'medium',
            path: ideaPath,
        });

        return this.getIdea(ideaPath);
    }

    async updateIdeaMeta(path: string, input: UpdateIdeaInput): Promise<IdeaDetailDto> {
        const existing = await this.repository.findByPath(path);

        if (!existing) {
            throw new HTTPException(404, { message: `Idea with path ${path} not found` });
        }

        await this.repository.updateByPath(path, {
            title: input.title,
            tags: input.tags,
            status: input.status,
            priority: input.priority,
        });

        return this.getIdea(path);
    }

    async deleteIdea(path: string): Promise<void> {
        const exists = await this.repository.exists(path);
        if (!exists) {
            throw new HTTPException(404, { message: `Idea with path ${path} not found` });
        }

        await this.ideaFile.deleteIdeaDirectory(path);
        await this.repository.deleteByPath(path);
    }

    async touchUpdatedAt(path: string): Promise<void> {
        const exists = await this.repository.exists(path);
        if (!exists) {
            throw new HTTPException(404, { message: `Idea with path ${path} not found` });
        }

        await this.repository.touchUpdatedAt(path);
    }
}