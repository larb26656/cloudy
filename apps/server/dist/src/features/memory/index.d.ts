export declare const memory: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $get: {
            input: {
                query: {
                    q?: string | undefined;
                    tags?: string[] | undefined;
                    order?: string | undefined;
                };
            };
            output: import("zod").ZodSafeParseError<{
                q?: string | undefined;
                tags?: string[] | undefined;
                order?: string | undefined;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                query: {
                    q?: string | undefined;
                    tags?: string[] | undefined;
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
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
            }[];
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:path": {
        $get: {
            input: {
                param: {
                    path: string;
                };
            };
            output: {
                name: string;
                path: string;
                content: string;
                meta: {
                    title?: string | undefined;
                    tags: string[];
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
}, "/", "/:path">;
