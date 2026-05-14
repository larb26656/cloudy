import type { CloudyConfig } from '../../config'
import { readdir, access } from "node:fs/promises";
import path from "node:path";
import matter from 'gray-matter';

function isDateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(str);
}

function parseArtifactFrontMatter(markdown: string, fallbackTitle?: string): { meta: { title?: string; tags: string[]; type: string; createdAt?: Date; updatedAt?: Date }; content: string } {
    try {
        const { data, content } = matter(markdown);
        const title = data.title && typeof data.title === 'string' && !isDateString(data.title)
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

export class Artifact {
    private artifactPath: string;

    constructor(config: CloudyConfig) {
        this.artifactPath = config.artifact;
    }

    private async getIndexFiles(): Promise<string[]> {
        const indexFiles: string[] = [];
        const allPaths = await readdir(this.artifactPath, { recursive: true });

        const subfolders = new Set<string>();
        for (const filePath of allPaths) {
            if (typeof filePath !== 'string' || filePath.endsWith('/')) continue;
            const parts = filePath.split('/').filter(Boolean);
            if (parts.length >= 1) {
                subfolders.add(parts[0]);
            }
        }

        for (const folder of subfolders) {
            const folderPath = path.join(this.artifactPath, folder);
            const indexPath = path.join(folderPath, 'index.md');
            if (await fileExists(indexPath)) {
                indexFiles.push(`${folder}/index.md`);
            }
        }

        return indexFiles;
    }

    async getFiles(): Promise<{ source: 'artifact'; files: { name: string; path: string }[] }> {
        const files: { name: string; path: string }[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                const name = filePath.split('/')[0];
                files.push({ name, path: filePath });
            }

        } catch {
            throw new Response('Artifact directory not found', { status: 404 });
        }

        return { source: 'artifact', files };
    }

    async getFile(filePath: string): Promise<{ name: string; path: string; content: string }> {
        const fullPath = `${this.artifactPath}/${filePath}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        const { readFile } = await import('node:fs/promises');
        const content = await readFile(fullPath, 'utf-8');
        const name = filePath.split('/').pop() || '';

        return { name, path: filePath, content };
    }

    async getArtifact(filePath: string): Promise<{ name: string; path: string; content: string; meta: { title?: string; tags: string[]; type: string; createdAt?: Date; updatedAt?: Date } }> {
        const fullPath = `${this.artifactPath}/${filePath}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        const { readFile } = await import('node:fs/promises');
        const content = await readFile(fullPath, 'utf-8');
        const parts = filePath.split('/');
        const name = parts[0];
        const parsed = parseArtifactFrontMatter(content, name);

        return {
            name,
            path: filePath,
            content: parsed.content,
            meta: {
                title: parsed.meta.title || name,
                tags: parsed.meta.tags || [],
                type: parsed.meta.type || 'html',
                createdAt: parsed.meta.createdAt,
                updatedAt: parsed.meta.updatedAt,
            },
        };
    }

    async getArtifactFolder(folderName: string): Promise<string> {
        return path.join(this.artifactPath, folderName);
    }

    private matchesFilter(artifact: { content: string; meta: { title?: string; tags: string[]; type: string } }, filters?: { q?: string; tags?: string[]; type?: string; order?: string }): boolean {
        if (!filters) return true;

        if (filters.q) {
            const query = filters.q.toLowerCase();
            const matchTitle = artifact.meta.title?.toLowerCase().includes(query);
            const matchContent = artifact.content.toLowerCase().includes(query);
            const matchTags = artifact.meta.tags.some(t => t.toLowerCase().includes(query));
            if (!matchTitle && !matchContent && !matchTags) return false;
        }

        if (filters.tags?.length) {
            if (!filters.tags.some(t => artifact.meta.tags.includes(t))) return false;
        }

        if (filters.type && artifact.meta.type !== filters.type) return false;

        return true;
    }

    async listArtifacts(filters?: { q?: string; tags?: string[]; type?: string; order?: string }): Promise<{ name: string; path: string; content: string; meta: { title?: string; tags: string[]; type: string; createdAt?: Date; updatedAt?: Date } }[]> {
        const artifacts: { name: string; path: string; content: string; meta: { title?: string; tags: string[]; type: string; createdAt?: Date; updatedAt?: Date } }[] = [];

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
            console.error('Error listing artifacts')
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
        const folderPath = await this.getArtifactFolder(name);
        const response = await this.serveFile(folderPath, meta.type);
        return response;
    }

    async serveFile(dirPath: string, type: string): Promise<Response> {
        const filePath = `${dirPath}/artifact.${type}`;
        const exists = await fileExists(filePath);

        if (!exists) {
            return new Response('File not found', { status: 404 });
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

function getContentType(type?: string): string {
    switch (type) {
        case 'html': return 'text/html';
        case 'pdf': return 'application/pdf';
        case 'image': return 'image/*';
        case 'video': return 'video/*';
        default: return 'application/octet-stream';
    }
}