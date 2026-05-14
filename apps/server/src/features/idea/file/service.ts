import { IDEA_INDEX_FILE } from '../types';
import { readdir, stat, rm, mkdir, unlink, access } from "node:fs/promises";
import path from "node:path";
import { IdeaRepository } from '../repository';
import type { CloudyConfig } from '../../../config';

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

export class IdeaFile {
    protected ideaRepository: IdeaRepository;
    protected ideaPath: string;

    constructor(ideaRepository: IdeaRepository, config: CloudyConfig) {
        this.ideaRepository = ideaRepository;
        this.ideaPath = config.idea;
    }

    private parseFilePath(filePath: string): { ideaPath: string; filename: string } {
        const parts = filePath.split('/');
        return {
            ideaPath: parts[0] ?? '',
            filename: parts.pop() ?? '',
        };
    }

    async getFile(ideaPath: string, filename: string = IDEA_INDEX_FILE): Promise<{ name: string; path: string; content: string }> {
        const fullPath = `${this.ideaPath}/${ideaPath}/${filename}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        const { readFile } = await import('node:fs/promises');
        const rawContent = await readFile(fullPath, 'utf-8');

        return {
            name: filename,
            path: `${ideaPath}/${filename}`,
            content: rawContent,
        };
    }

    async createFile(ideaPath: string, filename: string, content: string = ''): Promise<{ name: string; path: string; content: string }> {
        const exists = await this.ideaRepository.exists(ideaPath);
        if (!exists) {
            throw new Response('Idea not found', { status: 404 });
        }

        const ideaFolder = `${this.ideaPath}/${ideaPath}`;

        let ideaFolderExists = false;
        try {
            const folderStat = await stat(ideaFolder);
            ideaFolderExists = folderStat.isDirectory();
        } catch {
            ideaFolderExists = false;
        }

        if (!ideaFolderExists) {
            throw new Response('File not found', { status: 404 });
        }

        const fullPath = `${ideaFolder}/${filename}`;

        if (await fileExists(fullPath)) {
            throw new Response('File already exists', { status: 400 });
        }

        const { writeFile } = await import('node:fs/promises');
        await writeFile(fullPath, content, 'utf-8');
        await this.ideaRepository.touchUpdatedAt(ideaPath);

        return { name: filename, path: `${ideaPath}/${filename}`, content };
    }

    async updateFile(filePath: string, content: string): Promise<{ name: string; path: string; content: string }> {
        const { ideaPath, filename } = this.parseFilePath(filePath);

        const exists = await this.ideaRepository.exists(ideaPath);
        if (!exists) {
            throw new Response('Idea not found', { status: 404 });
        }

        const fullPath = `${this.ideaPath}/${filePath}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        const { writeFile } = await import('node:fs/promises');
        await writeFile(fullPath, content, 'utf-8');
        await this.ideaRepository.touchUpdatedAt(ideaPath);

        return { name: filename, path: filePath, content };
    }

    async deleteFile(filePath: string): Promise<{ success: boolean }> {
        const parts = filePath.split('/');
        const { ideaPath, filename } = this.parseFilePath(filePath);

        const exists = await this.ideaRepository.exists(ideaPath);
        if (!exists) {
            throw new Response('Idea not found', { status: 404 });
        }

        const fullPath = `${this.ideaPath}/${filePath}`;

        if (!await fileExists(fullPath)) {
            throw new Response('File not found', { status: 404 });
        }

        if (parts.length === 2 && filename === 'index.md') {
            throw new Response('Cannot delete index.md', { status: 400 });
        }

        await unlink(fullPath);
        await this.ideaRepository.touchUpdatedAt(ideaPath);

        return { success: true };
    }

    async createIdeaDirectory(ideaPath: string, content: string = ''): Promise<void> {
        const ideaFolder = `${this.ideaPath}/${ideaPath}`;

        try {
            const folderStat = await stat(ideaFolder);
            if (folderStat.isDirectory()) {
                throw new Response('Folder already exists', { status: 400 });
            }
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }

        await mkdir(ideaFolder, { recursive: true });

        const indexPath = `${ideaFolder}/index.md`;
        const { writeFile } = await import('node:fs/promises');
        await writeFile(indexPath, content, 'utf-8');
    }

    async deleteIdeaDirectory(ideaPath: string): Promise<void> {
        const ideaFolder = `${this.ideaPath}/${ideaPath}`;
        try {
            await rm(ideaFolder, { recursive: true });
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }
    }

    async listIdeaFiles(ideaPath: string): Promise<{ name: string; path: string; size: number; updatedAt?: Date }[]> {
        const folderPath = `${this.ideaPath}/${ideaPath}`;
        const files: { name: string; path: string; size: number; updatedAt?: Date }[] = [];

        try {
            const entries = await readdir(folderPath);
            for (const entry of entries) {
                if (entry.endsWith('.md')) {
                    const filePath = path.join(folderPath, entry);
                    try {
                        const fileStat = await stat(filePath);
                        files.push({
                            name: entry,
                            path: ideaPath + '/' + entry,
                            size: fileStat.size,
                            updatedAt: fileStat.mtime,
                        });
                    } catch {
                        continue;
                    }
                }
            }
        } catch {
            return [];
        }

        return files.sort((a, b) => (a.name === 'index.md' ? -1 : b.name === 'index.md' ? 1 : 0));
    }
}