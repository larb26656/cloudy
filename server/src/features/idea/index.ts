import { Elysia, t } from 'elysia'

import { Idea } from './service'
import { IdeaModel } from './model'

export const idea = new Elysia({ prefix: '/idea' })
    .get('/', async ({ query }) => {
        return await Idea.listIdeas(query);
    }, {
        query: IdeaModel.querySchema,
        response: {
            200: t.Array(IdeaModel.ideaDto),
        }
    })
    .get('/:path', async ({ params: { path } }) => {
        return await Idea.getIdea(path);
    }, {
        response: {
            200: IdeaModel.ideaDto,
            404: IdeaModel.fileNotFound,
        }
    })
