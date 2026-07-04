import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import type { CloudyConfig } from '../../config';

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

export class ArtifactRepository {
    constructor(private config: CloudyConfig) {}

    private get artifactPath(): string {
        return this.config.artifact;
    }

    async getArtifactFolder(name: string): Promise<string> {
        return path.join(this.artifactPath, name);
    }

    async listArtifactIndexFiles(): Promise<string[]> {
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

    async artifactExists(name: string): Promise<boolean> {
        const indexPath = path.join(this.artifactPath, name, 'index.md');
        return fileExists(indexPath);
    }

    async fileExists(filePath: string): Promise<boolean> {
        const fullPath = path.join(this.artifactPath, filePath);
        return fileExists(fullPath);
    }
}