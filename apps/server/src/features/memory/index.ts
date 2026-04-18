import { Elysia, t } from 'elysia'

import { memoryService } from '../../container'
import { MemoryModel } from './model'

export const memory = new Elysia({ prefix: '/memory' })
    .get('/', async ({ query }) => {
        return await memoryService.listMemories(query);
    }, {
        query: MemoryModel.querySchema,
        response: {
            200: t.Array(MemoryModel.memoryDto),
        }
    })
    .get('/:path', async ({ params: { path } }) => {
        return await memoryService.getMemory(path);
    }, {
        response: {
            200: MemoryModel.memoryDto,
            404: MemoryModel.fileNotFound,
        }
    })
