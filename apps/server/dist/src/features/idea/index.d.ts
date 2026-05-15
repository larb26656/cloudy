export declare const idea: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, ({
    "/": {
        $get: {
            input: {
                query: {
                    q?: string | undefined;
                    tags?: string[] | undefined;
                    status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                    priority?: "low" | "medium" | "high" | undefined;
                    order?: string | undefined;
                };
            };
            output: import("zod").ZodSafeParseError<{
                q?: string | undefined;
                tags?: string[] | undefined;
                status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                priority?: "low" | "medium" | "high" | undefined;
                order?: string | undefined;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                query: {
                    q?: string | undefined;
                    tags?: string[] | undefined;
                    status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                    priority?: "low" | "medium" | "high" | undefined;
                    order?: string | undefined;
                };
            };
            output: {
                title: string;
                path: string;
                content: string;
                meta: {
                    tags: string[];
                    status: "draft" | "in-progress" | "completed" | "archived";
                    priority: "low" | "medium" | "high";
                    title?: string | undefined;
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
                title: string;
                path: string;
                content: string;
                files: {
                    name: string;
                    path: string;
                    size: number;
                    updatedAt?: string | undefined;
                }[];
                meta: {
                    tags: string[];
                    status: "draft" | "in-progress" | "completed" | "archived";
                    priority: "low" | "medium" | "high";
                    title?: string | undefined;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/": {
        $post: {
            input: {
                json: {
                    title: string;
                    tags?: string[] | undefined;
                    status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                    priority?: "low" | "medium" | "high" | undefined;
                    content?: string | undefined;
                };
            };
            output: import("zod").ZodSafeParseError<{
                title: string;
                tags?: string[] | undefined;
                status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                priority?: "low" | "medium" | "high" | undefined;
                content?: string | undefined;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                json: {
                    title: string;
                    tags?: string[] | undefined;
                    status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                    priority?: "low" | "medium" | "high" | undefined;
                    content?: string | undefined;
                };
            };
            output: {
                title: string;
                path: string;
                content: string;
                files: {
                    name: string;
                    path: string;
                    size: number;
                    updatedAt?: string | undefined;
                }[];
                meta: {
                    tags: string[];
                    status: "draft" | "in-progress" | "completed" | "archived";
                    priority: "low" | "medium" | "high";
                    title?: string | undefined;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
            };
            outputFormat: "json";
            status: 201;
        };
    };
} & {
    "/:path": {
        $delete: {
            input: {
                param: {
                    path: string;
                };
            };
            output: {
                success: boolean;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:path": {
        $patch: {
            input: {
                json: {
                    title?: string | undefined;
                    tags?: string[] | undefined;
                    status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                    priority?: "low" | "medium" | "high" | undefined;
                };
            } & {
                param: {
                    path: string;
                };
            };
            output: {
                title: string;
                path: string;
                content: string;
                files: {
                    name: string;
                    path: string;
                    size: number;
                    updatedAt?: string | undefined;
                }[];
                meta: {
                    tags: string[];
                    status: "draft" | "in-progress" | "completed" | "archived";
                    priority: "low" | "medium" | "high";
                    title?: string | undefined;
                    createdAt?: string | undefined;
                    updatedAt?: string | undefined;
                };
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {
                json: {
                    title?: string | undefined;
                    tags?: string[] | undefined;
                    status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                    priority?: "low" | "medium" | "high" | undefined;
                };
            } & {
                param: {
                    path: string;
                };
            };
            output: import("zod").ZodSafeParseError<{
                title?: string | undefined;
                tags?: string[] | undefined;
                status?: "draft" | "in-progress" | "completed" | "archived" | undefined;
                priority?: "low" | "medium" | "high" | undefined;
            }>;
            outputFormat: "json";
            status: 400;
        };
    };
} & {
    "/:path/touch": {
        $patch: {
            input: {
                param: {
                    path: string;
                };
            };
            output: {
                success: true;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
}) | import("hono/types").MergeSchemaPath<{
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
}, "/">, "/", "/:path/touch">;
