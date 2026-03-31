import { status } from 'elysia'
import { FileModel } from './model'
import { resourceConfig } from '../../../config'
import { IDEA_INDEX_FILE } from '../types';
import { readdir, stat, rm, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { IdeaRepository } from '../repository';

export class IdeaFile {
    constructor(
        protected ideaRepository: IdeaRepository,
    ) { }

    private parseFilePath(filePath: string): { ideaPath: string; filename: string } {
        const parts = filePath.split('/');
        return {
            ideaPath: parts[0] ?? '',
            filename: parts.pop() ?? '',
        };
    }

    async getFile(ideaPath: string, filename: string = IDEA_INDEX_FILE): Promise<FileModel["fileDto"]> {
        const fullPath = `${resourceConfig.idea}/${ideaPath}/${filename}`;
        // console.log(fullPath);
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies FileModel["fileNotFound"]);
        }

        const rawContent = await file.text();

        return {
            name: filename,
            path: `${ideaPath}/${filename}`,
            content: rawContent,
        };
    }

    async createFile(ideaPath: string, filename: string, content: string = ''): Promise<FileModel["fileDto"]> {
        const exists = await this.ideaRepository.exists(ideaPath);
        if (!exists) {
            throw status(404, 'Idea not found' as any);
        }

        const ideaFolder = `${resourceConfig.idea}/${ideaPath}`;

        let ideaFolderExists = false;
        try {
            const folderStat = await stat(ideaFolder);
            ideaFolderExists = folderStat.isDirectory();
        } catch {
            ideaFolderExists = false;
        }

        if (!ideaFolderExists) {
            throw status(404, 'File not found' satisfies FileModel["fileNotFound"]);
        }

        const fullPath = `${ideaFolder}/${filename}`;
        const file = Bun.file(fullPath);

        if (await file.exists()) {
            throw status(400, 'File already exists');
        }

        await Bun.write(fullPath, content);
        await this.ideaRepository.touchUpdatedAt(ideaPath);

        return { name: filename, path: `${ideaPath}/${filename}`, content };
    }

    async updateFile(filePath: string, content: string): Promise<FileModel["fileDto"]> {
        const { ideaPath, filename } = this.parseFilePath(filePath);

        const exists = await this.ideaRepository.exists(ideaPath);
        if (!exists) {
            throw status(404, 'Idea not found' as any);
        }

        const fullPath = `${resourceConfig.idea}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies FileModel["fileNotFound"]);
        }

        await Bun.write(fullPath, content);
        await this.ideaRepository.touchUpdatedAt(ideaPath);

        return { name: filename, path: filePath, content };
    }

    async deleteFile(filePath: string): Promise<{ success: boolean }> {
        const parts = filePath.split('/');
        const { ideaPath, filename } = this.parseFilePath(filePath);

        const exists = await this.ideaRepository.exists(ideaPath);
        if (!exists) {
            throw status(404, 'Idea not found' as any);
        }

        const fullPath = `${resourceConfig.idea}/${filePath}`;
        const file = Bun.file(fullPath);

        if (!await file.exists()) {
            throw status(404, 'File not found' satisfies FileModel["fileNotFound"]);
        }

        if (parts.length === 2 && filename === 'index.md') {
            throw status(400, 'Cannot delete index.md');
        }

        await unlink(fullPath);
        await this.ideaRepository.touchUpdatedAt(ideaPath);

        return { success: true };
    }

    async createIdeaDirectory(ideaPath: string, content: string = ''): Promise<void> {
        const ideaFolder = `${resourceConfig.idea}/${ideaPath}`;

        try {
            const folderStat = await stat(ideaFolder);
            if (folderStat.isDirectory()) {
                throw status(400, 'Folder already exists');
            }
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }

        await mkdir(ideaFolder, { recursive: true });

        const indexPath = `${ideaFolder}/index.md`;
        await Bun.write(indexPath, content);
    }

    async deleteIdeaDirectory(ideaPath: string): Promise<void> {
        const ideaFolder = `${resourceConfig.idea}/${ideaPath}`;
        try {
            await rm(ideaFolder, { recursive: true });
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }
    }

    async listIdeaFiles(ideaPath: string): Promise<FileModel["fileMetaDto"][]> {
        const folderPath = `${resourceConfig.idea}/${ideaPath}`;
        const files: FileModel["fileMetaDto"][] = [];

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