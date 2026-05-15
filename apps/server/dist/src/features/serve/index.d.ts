export declare const serve: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $post: {
            input: {
                json: {
                    dirPath: string;
                    expireIn: string;
                };
            };
            output: import("zod").ZodSafeParseError<{
                dirPath: string;
                expireIn: string;
            }>;
            outputFormat: "json";
            status: 400;
        } | {
            input: {
                json: {
                    dirPath: string;
                    expireIn: string;
                };
            };
            output: {
                key: string;
                expireIn: string;
            };
            outputFormat: "json";
            status: 201;
        };
    };
} & {
    "/": {
        $get: {
            input: {};
            output: {
                key: string;
                dirPath: string;
                expireIn: string;
                lastAccessed: number;
            }[];
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:key": {
        $get: {
            input: {
                param: {
                    key: string;
                };
            };
            output: {
                key: string;
                dirPath: string;
                expireIn: string;
                lastAccessed: number;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        };
    };
} & {
    "/:key": {
        $put: {
            input: {
                json: {
                    dirPath: string;
                    expireIn: string;
                };
            } & {
                param: {
                    key: string;
                };
            };
            output: {
                key: string;
                dirPath: string;
                expireIn: string;
                lastAccessed: number;
            };
            outputFormat: "json";
            status: import("hono/utils/http-status").ContentfulStatusCode;
        } | {
            input: {
                json: {
                    dirPath: string;
                    expireIn: string;
                };
            } & {
                param: {
                    key: string;
                };
            };
            output: import("zod").ZodSafeParseError<{
                dirPath: string;
                expireIn: string;
            }>;
            outputFormat: "json";
            status: 400;
        };
    };
} & {
    "/:key": {
        $delete: {
            input: {
                param: {
                    key: string;
                };
            };
            output: null;
            outputFormat: "body";
            status: 204;
        };
    };
} & {
    "/:key/files": {
        $get: {
            input: {
                param: {
                    key: string;
                };
            };
            output: {};
            outputFormat: string;
            status: import("hono/utils/http-status").StatusCode;
        };
    };
}, "/", "/:key/files">;
export declare function startCleanupCron(): void;
