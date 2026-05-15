import type { CloudyConfig } from '../../config';
export declare class Memory {
    private memoryPath;
    constructor(config: CloudyConfig);
    private getIndexFiles;
    getFiles(): Promise<{
        source: 'memory';
        files: {
            name: string;
            path: string;
        }[];
    }>;
    getFile(filePath: string): Promise<{
        name: string;
        path: string;
        content: string;
    }>;
    getMemory(filePath: string): Promise<{
        name: string;
        path: string;
        content: string;
        meta: {
            title?: string;
            tags: string[];
            createdAt?: Date;
            updatedAt?: Date;
        };
    }>;
    private matchesFilter;
    listMemories(filters?: {
        q?: string;
        tags?: string[];
        order?: string;
    }): Promise<{
        name: string;
        path: string;
        content: string;
        meta: {
            title?: string;
            tags: string[];
            createdAt?: Date;
            updatedAt?: Date;
        };
    }[]>;
}
