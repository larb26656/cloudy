import { Hono } from 'hono';
export declare function createApp({ corsOrigins, enableUI }: {
    corsOrigins?: string[];
    enableUI?: boolean;
}): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
declare const app: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export { app };
export type AppType = typeof app;
