import { Elysia, t } from 'elysia'

import { Memory } from './service'
import { MemoryModel } from './model'

export const memory = new Elysia({ prefix: '/memory' })
    .get('/', async () => {
        return await Memory.getFiles();
    }, {
        response: {
            200: MemoryModel.fileListDto,
        }
    })
    .get('/*', async ({ params: { '*': filePath } }) => {
        return await Memory.getFile(filePath);
    }, {
        response: {
            200: MemoryModel.fileDto,
            404: MemoryModel.fileNotFound,
        }
    })
