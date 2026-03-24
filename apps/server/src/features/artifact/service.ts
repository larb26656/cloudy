import { status } from 'elysia'
import { ArtifactModel } from './model'
import { resourceConfig } from '../../config'
import { readdir } from "node:fs/promises";
import path from "node:path";
import matter from 'gray-matter';

function parseArtifactFrontMatter(markdown: string, fallbackTitle?: string): { meta: ArtifactModel['metaDto']; content: string } {
    const { data, content } = matter(markdown);

    return {
        meta: {
            title: data.title ?? fallbackTitle,
            tags: Array.isArray(data.tags) ? data.tags : [],
            type: data.type ?? 'html',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        },
        content,
    };
}

export abstract class Artifact {

    private static async getIndexFiles(): Promise<string[]> {
        const indexFiles: string[] = [];
        const allPaths = await readdir(resourceConfig.artifact, { recursive: true });

        const subfolders = new Set<string>();
        for (const filePath of allPaths) {
            if (typeof filePath !== 'string' || filePath.endsWith('/')) continue;
            const parts = filePath.split('/').filter(Boolean);
            if (parts.length >= 1) {
                subfolders.add(parts[0]);
            }
        }

        for (const folder of subfolders) {
            const folderPath = path.join(resourceConfig.artifact, folder);
            const indexPath = path.join(folderPath, 'index.md');
            const indexFile = Bun.file(indexPath);
            if (await indexFile.exists()) {
                indexFiles.push(`${folder}/index.md`);
            }
        }

        return indexFiles;
    }

    static async getFiles(): Promise<ArtifactModel["fileListDto"]> {
        const files: { name: string; path: string }[] = [];

        try {
            const indexFiles = await this.getIndexFiles();

            for (const filePath of indexFiles) {
                const name = filePath.split('/')[0];
                files.push({ name, path: filePath });
            }

        } catch (e) {
            throw status(404, 'Artifact directory not found');
        }

        return { source: 'artifact', files };
    }

    static async getFile(filePath: string): Promise<ArtifactModel["fileDto"]> {
        const fullPath = `${resourceConfig.artifact}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies ArtifactModel["fileNotFound"]);
        }

        const content = await file.text();
        const name = filePath.split('/').pop() || '';

        return { name, path: filePath, content };
    }

    static async getArtifact(filePath: string): Promise<ArtifactModel["artifactDto"]> {
        const fullPath = `${resourceConfig.artifact}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies ArtifactModel["fileNotFound"]);
        }

        const content = await file.text();
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

    static async getArtifactFolder(folderName: string): Promise<string> {
        return path.join(resourceConfig.artifact, folderName);
    }

    private static matchesFilter(artifact: ArtifactModel["artifactDto"], filters?: ArtifactModel["querySchema"]): boolean {
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

    static async listArtifacts(filters?: ArtifactModel["querySchema"]): Promise<ArtifactModel["artifactDto"][]> {
        const artifacts: ArtifactModel["artifactDto"][] = [];

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

    static async getByName(name: string): Promise<ArtifactModel["getFileRes"]> {
        const artifactData = await Artifact.getArtifact(`${name}/index.md`);
        const meta = artifactData.meta;
        const folderPath = await Artifact.getArtifactFolder(name);
        const file = await this.serveFile(folderPath, meta.type);
        const contentType = getContentType(meta.type);

        if (!file) {
            throw status(404, 'File not found' satisfies ArtifactModel["fileNotFound"]);
        }

        return {
            name,
            contentType,
            file
        }
    }

    static async serveFile(dirPath: string, type: ArtifactModel["artifactType"]): Promise<Blob | null> {
        const filePath = `${dirPath}/artifact.${type}`;
        console.log(filePath);
        const file = Bun.file(filePath);
        const exists = await file.exists();

        if (!exists) {
            return null;
        }

        return file;
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

