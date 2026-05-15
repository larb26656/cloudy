import { z } from 'zod';
export declare const FileModel: {
    fileDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>;
    fileMetaDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        size: z.ZodNumber;
        updatedAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    fileNotFound: z.ZodLiteral<"File not found">;
};
export type FileModel = z.infer<typeof FileModel> & Record<string, unknown>;
