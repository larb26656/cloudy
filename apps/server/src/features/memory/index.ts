import { Elysia, t } from 'elysia'

import { Memory } from './service'
import { MemoryModel } from './model'

export const memory = new Elysia({ prefix: '/memory' })
    .get('/', async ({ query }) => {
        return await Memory.listMemories(query);
    }, {
        query: MemoryModel.querySchema,
        response: {
            200: t.Array(MemoryModel.memoryDto),
        }
    })
    .get('/:path', async ({ params: { path } }) => {
        return await Memory.getMemory(path);
    }, {
        response: {
            200: MemoryModel.memoryDto,
            404: MemoryModel.fileNotFound,
        }
    })
