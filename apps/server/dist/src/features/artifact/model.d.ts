import { z } from 'zod';
export declare const ArtifactModel: {
    artifactType: z.ZodUnion<readonly [z.ZodLiteral<"html">, z.ZodLiteral<"pdf">, z.ZodLiteral<"image">, z.ZodLiteral<"video">, z.ZodLiteral<"document">]>;
    metaDto: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        tags: z.ZodArray<z.ZodString>;
        type: z.ZodUnion<readonly [z.ZodLiteral<"html">, z.ZodLiteral<"pdf">, z.ZodLiteral<"image">, z.ZodLiteral<"video">, z.ZodLiteral<"document">]>;
        createdAt: z.ZodOptional<z.ZodDate>;
        updatedAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    artifactDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
        meta: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            tags: z.ZodArray<z.ZodString>;
            type: z.ZodUnion<readonly [z.ZodLiteral<"html">, z.ZodLiteral<"pdf">, z.ZodLiteral<"image">, z.ZodLiteral<"video">, z.ZodLiteral<"document">]>;
            createdAt: z.ZodOptional<z.ZodDate>;
            updatedAt: z.ZodOptional<z.ZodDate>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    getFileRes: z.ZodObject<{
        name: z.ZodString;
        contentType: z.ZodString;
        file: z.ZodAny;
    }, z.core.$strip>;
    fileDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>;
    fileListDto: z.ZodObject<{
        source: z.ZodLiteral<"artifact">;
        files: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            path: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    fileNotFound: z.ZodLiteral<"File not found">;
    querySchema: z.ZodObject<{
        q: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"html">, z.ZodLiteral<"pdf">, z.ZodLiteral<"image">, z.ZodLiteral<"video">, z.ZodLiteral<"document">]>>;
        order: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export type ArtifactModel = z.infer<typeof ArtifactModel> & Record<string, unknown>;
