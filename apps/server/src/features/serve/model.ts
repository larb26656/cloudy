import { t, type UnwrapSchema } from 'elysia'


export const ServeModel = {
    sessionDto: t.Object({
        key: t.String(),
        dirPath: t.String(),
        expireIn: t.String(),
        lastAccessed: t.Number(),
    }),
    createBody: t.Object({
        dirPath: t.String(),
        expireIn: t.String(),
    }),
    createRes: t.Object({
        key: t.String(),
        expireIn: t.String(),
    }),
    editBody: t.Object({
        dirPath: t.String(),
        expireIn: t.String(),
    }),
    signInResponse: t.Object({
        username: t.String(),
        token: t.String(),
    }),
    sessionNotFound
        : t
            .Literal
            ('Session not found'),
    indexNotFound
        : t
            .Literal
            ('Index file not found'),
} as const


export type ServeModel = {
    [k in keyof typeof ServeModel]: UnwrapSchema<typeof ServeModel[k]>
}