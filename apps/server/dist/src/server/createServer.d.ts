export interface ServerOptions {
    host?: string;
    port?: number;
    dataDir?: string;
    configDir?: string;
    corsOrigins?: string[];
    enableUI?: boolean;
    dbMigrationsDir?: string;
}
export declare function createServer(options: ServerOptions): {
    start: () => Promise<{
        url: string;
    }>;
    stop: () => Promise<void>;
};
