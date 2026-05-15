import type { CloudyConfig } from '../../config';
export declare class Artifact {
    private artifactPath;
    constructor(config: CloudyConfig);
    private getIndexFiles;
    getFiles(): Promise<{
        source: 'artifact';
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
    getArtifact(filePath: string): Promise<{
        name: string;
        path: string;
        content: string;
        meta: {
            title?: string;
            tags: string[];
            type: string;
            createdAt?: Date;
            updatedAt?: Date;
        };
    }>;
    getArtifactFolder(folderName: string): Promise<string>;
    private matchesFilter;
    listArtifacts(filters?: {
        q?: string;
        tags?: string[];
        type?: string;
        order?: string;
    }): Promise<{
        name: string;
        path: string;
        content: string;
        meta: {
            title?: string;
            tags: string[];
            type: string;
            createdAt?: Date;
            updatedAt?: Date;
        };
    }[]>;
    getByName(name: string): Promise<Response>;
    serveFile(dirPath: string, type: string): Promise<Response>;
}
