import { IdeaRepository } from '../repository';
import type { CloudyConfig } from '../../../config';
export declare class IdeaFile {
    protected ideaRepository: IdeaRepository;
    protected ideaPath: string;
    constructor(ideaRepository: IdeaRepository, config: CloudyConfig);
    private parseFilePath;
    getFile(ideaPath: string, filename?: string): Promise<{
        name: string;
        path: string;
        content: string;
    }>;
    createFile(ideaPath: string, filename: string, content?: string): Promise<{
        name: string;
        path: string;
        content: string;
    }>;
    updateFile(filePath: string, content: string): Promise<{
        name: string;
        path: string;
        content: string;
    }>;
    deleteFile(filePath: string): Promise<{
        success: boolean;
    }>;
    createIdeaDirectory(ideaPath: string, content?: string): Promise<void>;
    deleteIdeaDirectory(ideaPath: string): Promise<void>;
    listIdeaFiles(ideaPath: string): Promise<{
        name: string;
        path: string;
        size: number;
        updatedAt?: Date;
    }[]>;
}
