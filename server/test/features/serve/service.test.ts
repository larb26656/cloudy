import { describe, test, expect, beforeEach } from 'bun:test';
import {
    parseExpireIn,
    isExpired,
    resetSessions,
    getSessions,
    cleanupExpiredSessions,
    Serve,
} from '../../../src/features/serve/service';

describe('Serve Service', () => {
    beforeEach(() => {
        resetSessions();
    });

    describe('parseExpireIn', () => {
        test('parses seconds correctly', () => {
            expect(parseExpireIn('30s')).toBe(30000);
        });

        test('parses minutes correctly', () => {
            expect(parseExpireIn('5m')).toBe(300000);
        });

        test('parses hours correctly', () => {
            expect(parseExpireIn('1h')).toBe(3600000);
        });

        test('parses days correctly', () => {
            expect(parseExpireIn('7d')).toBe(604800000);
        });

        test('throws on invalid format', () => {
            expect(() => parseExpireIn('invalid')).toThrow();
            expect(() => parseExpireIn('1x')).toThrow();
            expect(() => parseExpireIn('')).toThrow();
        });
    });

    describe('Serve.create', () => {
        test('creates a session with valid data', async () => {
            const result = await Serve.create({ dirPath: '/test/path', expireIn: '1h' });

            expect(result.key).toBeDefined();
            expect(result.key.length).toBe(6);
            expect(result.expireIn).toBe('1h');

            const sessions = getSessions();
            expect(sessions[result.key]).toBeDefined();
            expect(sessions[result.key].dirPath).toBe('/test/path');
            expect(sessions[result.key].expireIn).toBe('1h');
        });

        test('generates unique keys', async () => {
            const keys = new Set<string>();
            for (let i = 0; i < 100; i++) {
                const result = await Serve.create({ dirPath: '/test', expireIn: '1h' });
                keys.add(result.key);
            }
            expect(keys.size).toBe(100);
        });
    });

    describe('Serve.get', () => {
        test('returns empty array when no sessions exist', async () => {
            const result = await Serve.get();
            expect(result).toEqual([]);
        });

        test('returns all non-expired sessions', async () => {
            await Serve.create({ dirPath: '/path1', expireIn: '1h' });
            await Serve.create({ dirPath: '/path2', expireIn: '1h' });

            const result = await Serve.get();
            expect(result.length).toBe(2);
        });

        test('updates lastAccessed on get', async () => {
            const created = await Serve.create({ dirPath: '/test', expireIn: '1h' });
            const originalLastAccessed = getSessions()[created.key].lastAccessed;

            await new Promise(resolve => setTimeout(resolve, 10));
            await Serve.get();

            const session = getSessions()[created.key];
            expect(session.lastAccessed).toBeGreaterThan(originalLastAccessed);
        });

        test('excludes expired sessions', async () => {
            const valid = await Serve.create({ dirPath: '/valid', expireIn: '1h' });

            const sessions = getSessions();
            sessions['expired'] = {
                key: 'expired',
                dirPath: '/expired',
                expireIn: '1s',
                expireAt: Date.now() - 1000,
                lastAccessed: Date.now() - 1000,
            };

            const result = await Serve.get();
            expect(result.length).toBe(1);
            expect(result[0].key).toBe(valid.key);
        });
    });

    describe('Serve.getByKey', () => {
        test('returns session by key', async () => {
            const created = await Serve.create({ dirPath: '/test', expireIn: '1h' });
            const result = await Serve.getByKey(created.key);

            expect(result.key).toBe(created.key);
            expect(result.dirPath).toBe('/test');
            expect(result.expireIn).toBe('1h');
        });

        test('throws 404 for non-existent key', async () => {
            await expect(Serve.getByKey('nonexistent')).rejects.toMatchObject({ code: 404 });
        });

        test('throws 404 for expired session', async () => {
            const sessions = getSessions();
            sessions['expired'] = {
                key: 'expired',
                dirPath: '/test',
                expireIn: '1s',
                expireAt: Date.now() - 1000,
                lastAccessed: Date.now() - 1000,
            };

            await expect(Serve.getByKey('expired')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('Serve.edit', () => {
        test('updates session dirPath', async () => {
            const created = await Serve.create({ dirPath: '/old', expireIn: '1h' });
            const result = await Serve.edit(created.key, { dirPath: '/new', expireIn: '2h' });

            expect(result.dirPath).toBe('/new');
            expect(result.expireIn).toBe('2h');
        });

        test('throws 404 for non-existent key', async () => {
            await expect(Serve.edit('nonexistent', { dirPath: '/new', expireIn: '1h' })).rejects.toMatchObject({ code: 404 });
        });

        test('throws 404 for expired session', async () => {
            const sessions = getSessions();
            sessions['expired'] = {
                key: 'expired',
                dirPath: '/test',
                expireIn: '1s',
                expireAt: Date.now() - 1000,
                lastAccessed: Date.now() - 1000,
            };

            await expect(Serve.edit('expired', { dirPath: '/new', expireIn: '1h' })).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('Serve.delete', () => {
        test('deletes existing session', async () => {
            const created = await Serve.create({ dirPath: '/test', expireIn: '1h' });
            expect(getSessions()[created.key]).toBeDefined();

            await Serve.delete(created.key);
            expect(getSessions()[created.key]).toBeUndefined();
        });

        test('throws 404 for non-existent key', async () => {
            await expect(Serve.delete('nonexistent')).rejects.toMatchObject({ code: 404 });
        });

        test('throws 404 for expired session', async () => {
            const sessions = getSessions();
            sessions['expired'] = {
                key: 'expired',
                dirPath: '/test',
                expireIn: '1s',
                expireAt: Date.now() - 1000,
                lastAccessed: Date.now() - 1000,
            };

            await expect(Serve.delete('expired')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('isExpired', () => {
        test('returns true for expired session', () => {
            const session = {
                key: 'test',
                dirPath: '/test',
                expireIn: '1s',
                expireAt: Date.now() - 1000,
                lastAccessed: Date.now(),
            };
            expect(isExpired(session)).toBe(true);
        });

        test('returns false for non-expired session', () => {
            const session = {
                key: 'test',
                dirPath: '/test',
                expireIn: '1h',
                expireAt: Date.now() + 3600000,
                lastAccessed: Date.now(),
            };
            expect(isExpired(session)).toBe(false);
        });
    });

    describe('cleanupExpiredSessions', () => {
        test('removes expired sessions', () => {
            const sessions = getSessions();
            sessions['expired1'] = {
                key: 'expired1',
                dirPath: '/test',
                expireIn: '1s',
                expireAt: Date.now() - 1000,
                lastAccessed: Date.now(),
            };
            sessions['expired2'] = {
                key: 'expired2',
                dirPath: '/test',
                expireIn: '1s',
                expireAt: Date.now() - 2000,
                lastAccessed: Date.now(),
            };
            sessions['valid'] = {
                key: 'valid',
                dirPath: '/test',
                expireIn: '1h',
                expireAt: Date.now() + 3600000,
                lastAccessed: Date.now(),
            };

            const count = cleanupExpiredSessions();
            expect(count).toBe(2);
            expect(sessions['expired1']).toBeUndefined();
            expect(sessions['expired2']).toBeUndefined();
            expect(sessions['valid']).toBeDefined();
        });

        test('returns 0 when no expired sessions', () => {
            const sessions = getSessions();
            sessions['valid'] = {
                key: 'valid',
                dirPath: '/test',
                expireIn: '1h',
                expireAt: Date.now() + 3600000,
                lastAccessed: Date.now(),
            };

            const count = cleanupExpiredSessions();
            expect(count).toBe(0);
        });
    });

    describe('Serve.serveIndex', () => {
        test('returns null when index.html does not exist', async () => {
            const result = await Serve.serveIndex('/nonexistent/path');
            expect(result).toBeNull();
        });

        test('returns Blob when index.html exists', async () => {
            const { mkdirSync, writeFileSync } = await import('fs');
            const testDir = '/tmp/test-serve-index';
            mkdirSync(testDir, { recursive: true });
            writeFileSync(`${testDir}/index.html`, '<html><body>Hello</body></html>');

            const result = await Serve.serveIndex(testDir);
            expect(result).toBeInstanceOf(Blob);
            expect(result!.size).toBeGreaterThan(0);

            const text = await result!.text();
            expect(text).toContain('<html>');
        });
    });
});
