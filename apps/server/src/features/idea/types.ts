export type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
export type IdeaPriority = 'low' | 'medium' | 'high';

export interface IdeaRecord {
    id: string;
    title: string | null;
    tags: string[];
    status: IdeaStatus;
    priority: IdeaPriority;
    path: string;
    created_at: string;
    updated_at: string;
}

export interface IdeaQuery {
    q?: string;
    tags?: string[];
    status?: IdeaStatus;
    priority?: IdeaPriority;
    order?: string;
}

export interface CreateIdeaInput {
    id: string;
    title?: string;
    tags?: string[];
    status?: IdeaStatus;
    priority?: IdeaPriority;
    path: string;
}

export interface UpdateIdeaInput {
    title?: string;
    tags?: string[];
    status?: IdeaStatus;
    priority?: IdeaPriority;
}
