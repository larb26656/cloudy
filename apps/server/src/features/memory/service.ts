import { MemoryRepository, type MemoryQuery } from './repository';
import type { MemoryRecordDTO } from './repository';
import { HTTPException } from 'hono/http-exception';

export class MemoryService {
    constructor(private repository: MemoryRepository) { }

    async listMemories(query?: MemoryQuery): Promise<MemoryRecordDTO[]> {
        return this.repository.findAll(query);
    }

    async getMemory(id: string): Promise<MemoryRecordDTO> {
        const memory = await this.repository.findById(id);

        if (!memory) {
            throw new HTTPException(404, { message: `Memory with ID ${id} not found` });
        }

        return memory;
    }

    async createMemory(input: { id: string; title?: string; content: string; tags?: string[] }): Promise<MemoryRecordDTO> {
        return this.repository.create(input);
    }

    async updateMemory(id: string, input: { title?: string; content?: string; tags?: string[] }): Promise<MemoryRecordDTO> {
        const memory = await this.repository.findById(id);

        if (!memory) {
            throw new HTTPException(404, { message: `Memory with ID ${id} not found` });
        }

        return this.repository.update(id, input);
    }

    async deleteMemory(id: string): Promise<void> {
        const memory = await this.repository.findById(id);

        if (!memory) {
            throw new HTTPException(404, { message: `Memory with ID ${id} not found` });
        }

        await this.repository.delete(id);
    }
}