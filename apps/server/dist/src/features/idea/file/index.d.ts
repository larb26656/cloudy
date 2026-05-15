export declare const ideaFile: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/:ideaPath/files/:filename": {
        $get: {
            input: {
                param: {
                    ideaPath: string;
                } & {
                    filename: string;
                };
            };
            output: {
                name: string;
                path: string;
                content: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:ideaPath/files/": {
        $post: {
            input: {
                json: {
                    name: string;
                    content?: string | undefined;
                };
            } & {
                param: {
                    ideaPath: string;
                };
            };
            output: import("zod").ZodSafeParseError<{
                name: string;
                content?: string | undefined;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                json: {
                    name: string;
                    content?: string | undefined;
                };
            } & {
                param: {
                    ideaPath: string;
                };
            };
            output: {
                name: string;
                path: string;
                content: string;
            };
            outputFormat: "json";
            status: 201;
        };
    };
} & {
    "/:ideaPath/files/:filename": {
        $put: {
            input: {
                json: {
                    content: string;
                };
            } & {
                param: {
                    ideaPath: string;
                } & {
                    filename: string;
                };
            };
            output: import("zod").ZodSafeParseError<{
                content: string;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                json: {
                    content: string;
                };
            } & {
                param: {
                    ideaPath: string;
                } & {
                    filename: string;
                };
            };
            output: {
                name: string;
                path: string;
                content: string;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:ideaPath/files/:filename": {
        $delete: {
            input: {
                param: {
                    ideaPath: string;
                } & {
                    filename: string;
                };
            };
            output: {
                success: boolean;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
}, "/", "/:ideaPath/files/:filename">;
