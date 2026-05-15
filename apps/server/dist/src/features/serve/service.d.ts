type SessionData = {
    key: string;
    dirPath: string;
    expireIn: string;
    expireAt: number;
    lastAccessed: number;
};
export declare function generateKey(): string;
export declare function parseExpireIn(expireIn: string): number;
export declare function isExpired(session: SessionData): boolean;
export declare function toSessionDto(session: SessionData): {
    key: string;
    dirPath: string;
    expireIn: string;
    lastAccessed: number;
};
export declare function cleanupExpiredSessions(): number;
export declare function getSessions(): Record<string, SessionData>;
export declare function resetSessions(): void;
export declare abstract class Serve {
    static create({ dirPath, expireIn }: {
        dirPath: string;
        expireIn: string;
    }): Promise<{
        key: string;
        expireIn: string;
    }>;
    static get(): Promise<{
        key: string;
        dirPath: string;
        expireIn: string;
        lastAccessed: number;
    }[]>;
    static getByKey(key: string): Promise<{
        key: string;
        dirPath: string;
        expireIn: string;
        lastAccessed: number;
    }>;
    static edit(key: string, { dirPath, expireIn }: {
        dirPath: string;
        expireIn: string;
    }): Promise<{
        key: string;
        dirPath: string;
        expireIn: string;
        lastAccessed: number;
    }>;
    static delete(key: string): Promise<void>;
    static serveIndex(dirPath: string): Promise<Response>;
}
export {};
