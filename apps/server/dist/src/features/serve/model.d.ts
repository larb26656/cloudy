import { z } from 'zod';
export declare const ServeModel: {
    sessionDto: z.ZodObject<{
        key: z.ZodString;
        dirPath: z.ZodString;
        expireIn: z.ZodString;
        lastAccessed: z.ZodNumber;
    }, z.core.$strip>;
    createBody: z.ZodObject<{
        dirPath: z.ZodString;
        expireIn: z.ZodString;
    }, z.core.$strip>;
    createRes: z.ZodObject<{
        key: z.ZodString;
        expireIn: z.ZodString;
    }, z.core.$strip>;
    editBody: z.ZodObject<{
        dirPath: z.ZodString;
        expireIn: z.ZodString;
    }, z.core.$strip>;
    signInResponse: z.ZodObject<{
        username: z.ZodString;
        token: z.ZodString;
    }, z.core.$strip>;
    sessionNotFound: z.ZodLiteral<"Session not found">;
    indexNotFound: z.ZodLiteral<"Index file not found">;
};
export type ServeModel = z.infer<typeof ServeModel> & Record<string, unknown>;
