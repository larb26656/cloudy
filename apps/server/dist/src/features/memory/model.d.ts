import { z } from 'zod';
export declare const MemoryModel: {
    metaDto: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        tags: z.ZodArray<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodDate>;
        updatedAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    memoryDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
        meta: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            tags: z.ZodArray<z.ZodString>;
            createdAt: z.ZodOptional<z.ZodDate>;
            updatedAt: z.ZodOptional<z.ZodDate>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    fileDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>;
    fileListDto: z.ZodObject<{
        source: z.ZodLiteral<"memory">;
        files: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            path: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    fileNotFound: z.ZodLiteral<"File not found">;
    querySchema: z.ZodObject<{
        q: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        order: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export type MemoryModel = z.infer<typeof MemoryModel> & Record<string, unknown>;
