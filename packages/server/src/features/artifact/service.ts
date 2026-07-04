import type { CloudyConfig } from '../../config';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { HTTPException } from 'hono/http-exception';
import type { ArtifactDto, ArtifactQuery } from './model';
import { ArtifactRepository } from './repository';

function isDateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(str);
}

function parseArtifactFrontMatter(
    markdown: string,
    fallbackTitle?: string
): {
    meta: {
        title?: string;
        tags: string[];
        type: string;
        createdAt?: Date;
        updatedAt?: Date;
    };
    content: string;
} {
    try {
        const { data, content } = matter(markdown);
        const title =
            data.title && typeof data.title === 'string' && !isDateString(data.title)
                ? data.title
                : fallbackTitle;

        return {
            meta: {
                title,
                tags: Array.isArray(data.tags) ? data.tags : [],
                type: data.type ?? 'html',
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
                type: 'html',
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

const artifactTypeMap: Record<string, string> = {
    html: 'text/html',
    pdf: 'application/pdf',
    image: 'image/*',
    video: 'video/*',
};

function getContentType(type?: string): string {
    if (!type) return 'application/octet-stream';
    return artifactTypeMap[type] || 'application/octet-stream';
}

export class ArtifactService {
    private artifactPath: string;
    private repository: ArtifactRepository;

    constructor(config: CloudyConfig) {
        this.artifactPath = config.artifact;
        this.repository = new ArtifactRepository(config);
    }

    private async getIndexFiles(): Promise<string[]> {
        return this.repository.listArtifactIndexFiles();
    }

    private matchesFilter(
        artifact: {
            content: string;
            meta: { title?: string; tags: string[]; type: string };
        },
        filters?: ArtifactQuery
    ): boolean {
        if (!filters) return true;

        if (filters.q) {
            const query = filters.q.toLowerCase();
            const matchTitle = artifact.meta.title?.toLowerCase().includes(query);
            const matchContent = artifact.content.toLowerCase().includes(query);
            const matchTags = artifact.meta.tags.some((t) => t.toLowerCase().includes(query));
            if (!matchTitle && !matchContent && !matchTags) return false;
        }

        if (filters.tags?.length) {
            if (!filters.tags.some((t) => artifact.meta.tags.includes(t))) return false;
        }

        if (filters.type && artifact.meta.type !== filters.type) return false;

        return true;
    }

    async getArtifact(filePath: string): Promise<ArtifactDto> {
        const fullPath = path.join(this.artifactPath, filePath);

        if (!await fileExists(fullPath)) {
            throw new HTTPException(404, { message: 'Artifact not found' });
        }

        const content = await readFile(fullPath, 'utf-8');
        const parts = filePath.split('/');
        const name = parts[0] ?? filePath;
        const parsed = parseArtifactFrontMatter(content, name);

        return {
            name,
            path: filePath,
            content: parsed.content,
            meta: {
                title: parsed.meta.title || name,
                tags: parsed.meta.tags || [],
                type: parsed.meta.type as ArtifactDto['meta']['type'],
                createdAt: parsed.meta.createdAt?.toISOString(),
                updatedAt: parsed.meta.updatedAt?.toISOString(),
            },
        };
    }

    async listArtifacts(filters?: ArtifactQuery): Promise<ArtifactDto[]> {
        const artifacts: ArtifactDto[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                try {
                    const artifact = await this.getArtifact(filePath);
                    if (this.matchesFilter(artifact, filters)) {
                        artifacts.push(artifact);
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
                artifacts.sort((a, b) => {
                    const aTime = a.meta.updatedAt ? new Date(a.meta.updatedAt).getTime() : 0;
                    const bTime = b.meta.updatedAt ? new Date(b.meta.updatedAt).getTime() : 0;
                    return (aTime - bTime) * dir;
                });
            }
        }

        return artifacts;
    }

    async getByName(name: string): Promise<Response> {
        const artifactData = await this.getArtifact(`${name}/index.md`);
        const meta = artifactData.meta;
        const folderPath = await this.repository.getArtifactFolder(name);
        return this.serveFile(folderPath, meta.type as string);
    }

    async serveFile(dirPath: string, type: string): Promise<Response> {
        const filePath = `${dirPath}/artifact.${type}`;
        const exists = await fileExists(filePath);

        if (!exists) {
            throw new HTTPException(404, { message: 'File not found' });
        }

        const { createReadStream } = await import('node:fs');
        const { Readable } = await import('node:stream');
        const stream = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream;

        return new Response(stream, {
            headers: {
                'Content-Type': getContentType(type),
            },
        });
    }
}