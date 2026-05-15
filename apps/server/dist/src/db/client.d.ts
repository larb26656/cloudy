import { type Client } from '@libsql/client';
import type { CloudyConfig } from '../config';
export declare class DbClient {
    private config;
    private db;
    constructor(config: CloudyConfig);
    private ensureDataDir;
    getClient(): Client;
    close(): Promise<void>;
}
