type DeviceType = 'mobile' | 'tablet' | 'desktop';
declare const BREAKPOINTS: {
    readonly mobile: 640;
    readonly tablet: 1024;
};
declare function getDeviceType(width: number): DeviceType;

interface MemoryMeta {
    title?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}
interface Memory {
    id: string;
    name: string;
    content: string;
    markdown: string;
    meta: MemoryMeta;
}
type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
type IdeaPriority = 'low' | 'medium' | 'high';
interface IdeaMeta {
    title?: string;
    tags: string[];
    status: IdeaStatus;
    priority: IdeaPriority;
    createdAt: string;
    updatedAt: string;
}
interface Idea {
    id: string;
    name: string;
    description: string;
    markdown: string;
    meta: IdeaMeta;
}

export { BREAKPOINTS, type DeviceType, type Idea, type IdeaMeta, type IdeaPriority, type IdeaStatus, type Memory, type MemoryMeta, getDeviceType };
