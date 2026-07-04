import type { MemoryDto } from './model';
import type { MemoryQuery, CreateMemoryInput, UpdateMemoryInput } from './model';
import { HTTPException } from 'hono/http-exception';
import { MemoryRepository } from './repository';

export class MemoryService {
    constructor(private repository: MemoryRepository) { }

    async listMemories(query?: MemoryQuery): Promise<MemoryDto[]> {
        return this.repository.findAll(query);
    }

    async getMemory(id: string): Promise<MemoryDto> {
        const memory = await this.repository.findById(id);

        if (!memory) {
            throw new HTTPException(404, { message: `Memory with ID ${id} not found` });
        }

        return memory;
    }

    async createMemory(input: CreateMemoryInput): Promise<MemoryDto> {
        return this.repository.create(input);
    }

    async updateMemory(id: string, input: UpdateMemoryInput): Promise<MemoryDto> {
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