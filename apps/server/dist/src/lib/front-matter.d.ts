export type ArtifactType = 'html' | 'pdf' | 'image' | 'video' | 'document';
export type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
export type IdeaPriority = 'low' | 'medium' | 'high';
export interface ArtifactMeta extends MemoryMeta {
    type?: ArtifactType;
}
export interface IdeaMeta extends MemoryMeta {
    status?: IdeaStatus;
    priority?: IdeaPriority;
}
export interface MemoryMeta {
    title?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}
export declare function stringifyFrontMatter(meta: MemoryMeta, content: string): string;
export declare function stringifyIdeaFrontMatter(meta: IdeaMeta, content: string): string;
