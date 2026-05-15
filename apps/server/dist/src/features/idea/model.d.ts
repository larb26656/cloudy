import { z } from 'zod';
export declare const IdeaModel: {
    ideaStatus: z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>;
    ideaPriority: z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>;
    metaDto: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        tags: z.ZodArray<z.ZodString>;
        status: z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>;
        priority: z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>;
        createdAt: z.ZodOptional<z.ZodDate>;
        updatedAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    ideaDto: z.ZodObject<{
        title: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
        meta: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            tags: z.ZodArray<z.ZodString>;
            status: z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>;
            priority: z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>;
            createdAt: z.ZodOptional<z.ZodDate>;
            updatedAt: z.ZodOptional<z.ZodDate>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    ideaDetailDto: z.ZodObject<{
        title: z.ZodString;
        path: z.ZodString;
        content: z.ZodString;
        files: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            path: z.ZodString;
            size: z.ZodNumber;
            updatedAt: z.ZodOptional<z.ZodDate>;
        }, z.core.$strip>>;
        meta: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            tags: z.ZodArray<z.ZodString>;
            status: z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>;
            priority: z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>;
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
        source: z.ZodLiteral<"idea">;
        files: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            path: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    fileMetaDto: z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        size: z.ZodNumber;
        updatedAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    fileNotFound: z.ZodLiteral<"File not found">;
    querySchema: z.ZodObject<{
        q: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>>;
        priority: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>>;
        order: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    ideaMetaUpdateDto: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>>;
        priority: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>>;
    }, z.core.$strip>;
    ideaCreateDto: z.ZodObject<{
        title: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"draft">, z.ZodLiteral<"in-progress">, z.ZodLiteral<"completed">, z.ZodLiteral<"archived">]>>;
        priority: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"low">, z.ZodLiteral<"medium">, z.ZodLiteral<"high">]>>;
        content: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
};
export type IdeaModel = z.infer<typeof IdeaModel> & Record<string, unknown>;
