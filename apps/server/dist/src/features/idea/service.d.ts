import { IdeaModel } from './model';
import { IdeaRepository } from './repository';
import { IdeaFile } from './file/service';
export declare function generateIdeaPath(title: string): string;
export declare class Idea {
    protected repository: IdeaRepository;
    protected ideaFile: IdeaFile;
    constructor(repository: IdeaRepository, ideaFile: IdeaFile);
    createIdea(input: z.infer<typeof IdeaModel.ideaCreateDto>): Promise<z.infer<typeof IdeaModel.ideaDetailDto>>;
    deleteIdea(ideaPath: string): Promise<{
        success: boolean;
    }>;
    patchMeta(ideaPath: string, updates: z.infer<typeof IdeaModel.ideaMetaUpdateDto>): Promise<z.infer<typeof IdeaModel.ideaDetailDto>>;
    getIdea(ideaPath: string): Promise<z.infer<typeof IdeaModel.ideaDetailDto>>;
    touchUpdatedAt(ideaPath: string): Promise<void>;
    listIdeas(filters?: z.infer<typeof IdeaModel.querySchema>): Promise<z.infer<typeof IdeaModel.ideaDto>[]>;
}
import { z } from 'zod';
