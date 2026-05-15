import type { Client } from '@libsql/client';
import type { IdeaRecord, IdeaQuery, CreateIdeaInput, UpdateIdeaInput } from './types';
export declare class IdeaRepository {
    private db;
    constructor(db: Client);
    findAll(query?: IdeaQuery): Promise<IdeaRecord[]>;
    findByPath(path: string): Promise<IdeaRecord | null>;
    findById(id: string): Promise<IdeaRecord | null>;
    exists(ideaPath: string): Promise<boolean>;
    touchUpdatedAt(ideaPath: string): Promise<void>;
    create(input: CreateIdeaInput): Promise<IdeaRecord>;
    update(id: string, input: UpdateIdeaInput): Promise<IdeaRecord>;
    updateByPath(ideaPath: string, input: UpdateIdeaInput): Promise<IdeaRecord>;
    delete(id: string): Promise<void>;
    deleteByPath(ideaPath: string): Promise<void>;
}
