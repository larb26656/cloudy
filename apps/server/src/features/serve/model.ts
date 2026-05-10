import { z } from 'zod'

export const ServeModel = {
    sessionDto: z.object({
        key: z.string(),
        dirPath: z.string(),
        expireIn: z.string(),
        lastAccessed: z.number(),
    }),
    createBody: z.object({
        dirPath: z.string(),
        expireIn: z.string(),
    }),
    createRes: z.object({
        key: z.string(),
        expireIn: z.string(),
    }),
    editBody: z.object({
        dirPath: z.string(),
        expireIn: z.string(),
    }),
    signInResponse: z.object({
        username: z.string(),
        token: z.string(),
    }),
    sessionNotFound: z.literal('Session not found'),
    indexNotFound: z.literal('Index file not found'),
}

export type ServeModel = z.infer<typeof ServeModel> & Record<string, unknown>