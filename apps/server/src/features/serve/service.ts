import { access } from "node:fs/promises";

type SessionData = {
    key: string
    dirPath: string
    expireIn: string
    expireAt: number
    lastAccessed: number
}

const sessions: Record<string, SessionData> = {};

export function generateKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

export function parseExpireIn(expireIn: string): number {
    const match = expireIn.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
        throw new Response('Invalid expireIn format. Use format like 30m, 1h, 7d', { status: 400 });
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: throw new Response('Invalid expireIn unit', { status: 400 });
    }
}

export function isExpired(session: SessionData): boolean {
    return Date.now() > session.expireAt;
}

export function toSessionDto(session: SessionData): { key: string; dirPath: string; expireIn: string; lastAccessed: number } {
    return {
        key: session.key,
        dirPath: session.dirPath,
        expireIn: session.expireIn,
        lastAccessed: session.lastAccessed,
    };
}

export function cleanupExpiredSessions(): number {
    let count = 0;
    for (const key of Object.keys(sessions)) {
        if (isExpired(sessions[key])) {
            delete sessions[key];
            count++;
        }
    }
    return count;
}



export function getSessions(): Record<string, SessionData> {
    return sessions;
}

export function resetSessions(): void {
    for (const key of Object.keys(sessions)) {
        delete sessions[key];
    }
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

export abstract class Serve {

    static async create({ dirPath, expireIn }: { dirPath: string; expireIn: string }) {
        const key = generateKey();
        const now = Date.now();

        sessions[key] = {
            key,
            dirPath,
            expireIn,
            expireAt: now + parseExpireIn(expireIn),
            lastAccessed: now,
        }

        return {
            key,
            expireIn,
        }
    }

    static async get() {
        const now = Date.now();
        const result: { key: string; dirPath: string; expireIn: string; lastAccessed: number }[] = [];

        for (const session of Object.values(sessions)) {
            if (isExpired(session)) continue;

            session.lastAccessed = now;
            result.push(toSessionDto(session));
        }

        return result;
    }

    static async getByKey(key: string) {
        const session = sessions[key];

        if (!session) {
            throw new Response('Session not found', { status: 404 });
        }

        if (isExpired(session)) {
            throw new Response('Session not found', { status: 404 });
        }

        const now = Date.now();
        session.lastAccessed = now;

        return toSessionDto(session);
    }

    static async edit(key: string, { dirPath, expireIn }: { dirPath: string; expireIn: string }) {
        const session = sessions[key];

        if (!session) {
            throw new Response('Session not found', { status: 404 });
        }

        if (isExpired(session)) {
            throw new Response('Session not found', { status: 404 });
        }

        const now = Date.now();

        const newData: SessionData = {
            ...session,
            dirPath,
            expireIn,
            expireAt: now + parseExpireIn(expireIn),
            lastAccessed: now,
        }

        sessions[key] = newData

        return toSessionDto(newData)
    }


    static async delete(key: string) {
        const session = sessions[key];

        if (!session) {
            throw new Response('Session not found', { status: 404 });
        }

        if (isExpired(session)) {
            throw new Response('Session not found', { status: 404 });
        }

        delete sessions[key];
    }

    static async serveIndex(dirPath: string): Promise<Response> {
        const filePath = `${dirPath}/index.html`;

        if (!await fileExists(filePath)) {
            return new Response('Index file not found', { status: 404 });
        }

        const { createReadStream } = await import('node:fs');
        const { Readable } = await import('node:stream');
        const stream = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream;

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    }
}