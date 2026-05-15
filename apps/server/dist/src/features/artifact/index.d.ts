export declare const artifact: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $get: {
            input: {
                query: {
                    q?: string | undefined;
                    tags?: string[] | undefined;
                    type?: "html" | "pdf" | "image" | "video" | "document" | undefined;
                    order?: string | undefined;
                };
            };
            output: import("zod").ZodSafeParseError<{
                q?: string | undefined;
                tags?: string[] | undefined;
                type?: "html" | "pdf" | "image" | "video" | "document" | undefined;
                order?: string | undefined;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                query: {
                    q?: string | undefined;
                    tags?: string[] | undefined;
                    type?: "html" | "pdf" | "image" | "video" | "document" | undefined;
                    order?: string | undefined;
                };
            };
            output: {
                name: string;
                path: string;
                content: string;
                meta: {
                    title?: string | undefined;
                    tags: string[];
                    type: string;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
            }[];
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:name": {
        $get: {
            input: {
                param: {
                    name: string;
                };
            };
            output: {};
            outputFormat: string;
            status: import("hono/utils/http-status").StatusCode;
        };
    };
}, "/", "/:name">;
