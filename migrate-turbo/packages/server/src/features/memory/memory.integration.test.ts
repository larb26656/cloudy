import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupMemoryApp, teardownMemoryApp, clearMemories, getMemoryApp, createMemory } from '../../../test/fixtures/memory-db'

describe('Memory API', () => {
    beforeAll(async () => {
        await setupMemoryApp()
    })

    afterAll(async () => {
        await teardownMemoryApp()
    })

    beforeEach(async () => {
        await clearMemories()
    })

    describe('GET /', () => {
        it('should return empty array when no memories exist', async () => {
            const app = getMemoryApp()
            const res = await app.request('/')
            expect(res.status).toBe(200)
            const memories = await res.json()
            expect(memories).toEqual([])
        })

        it('should return all memories', async () => {
            const app = getMemoryApp()
            await createMemory({ id: '1', content: 'Memory 1' })
            await createMemory({ id: '2', content: 'Memory 2' })

            const res = await app.request('/')
            expect(res.status).toBe(200)
            const memories = await res.json()
            expect(memories).toHaveLength(2)
        })

        it('should filter memories by search query', async () => {
            const app = getMemoryApp()
            await createMemory({ id: '1', title: 'Hello World', content: 'First memory' })
            await createMemory({ id: '2', title: 'Goodbye', content: 'Second memory' })

            const res = await app.request('/?q=Hello')
            expect(res.status).toBe(200)
            const memories = await res.json()
            expect(memories).toHaveLength(1)
            expect(memories[0].title).toBe('Hello World')
        })

        it('should filter memories by tags', async () => {
            const app = getMemoryApp()
            await createMemory({ id: '1', content: 'First', tags: ['work', 'urgent'] })
            await createMemory({ id: '2', content: 'Second', tags: ['personal'] })

            const res = await app.request('/?tags=work&tags=urgent')
            expect(res.status).toBe(200)
            const memories = await res.json()
            expect(memories).toHaveLength(1)
            expect(memories[0].content).toBe('First')
        })

        it('should order memories by updatedAt', async () => {
            const app = getMemoryApp()
            await createMemory({ id: '1', content: 'First' })
            await createMemory({ id: '2', content: 'Second' })

            const res = await app.request('/?order=updatedAt:asc')
            expect(res.status).toBe(200)
            const memories = await res.json()
            expect(memories[0].content).toBe('First')
            expect(memories[1].content).toBe('Second')
        })
    })

    describe('GET /:id', () => {
        it('should return memory by id', async () => {
            const app = getMemoryApp()
            await createMemory({ id: 'test-id', title: 'Test', content: 'Test content' })

            const res = await app.request('/test-id')
            expect(res.status).toBe(200)
            const memory = await res.json()
            expect(memory.id).toBe('test-id')
            expect(memory.title).toBe('Test')
            expect(memory.content).toBe('Test content')
        })

        it('should return 404 for non-existent memory', async () => {
            const app = getMemoryApp()
            const res = await app.request('/non-existent')
            expect(res.status).toBe(404)
        })
    })

    describe('POST /', () => {
        it('should create a new memory', async () => {
            const app = getMemoryApp()
            const res = await app.request('/', {
                method: 'POST',
                body: JSON.stringify({ id: 'new-1', title: 'New Memory', content: 'New content' }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(201)
            const memory = await res.json()
            expect(memory.id).toBe('new-1')
            expect(memory.title).toBe('New Memory')
            expect(memory.content).toBe('New content')
        })

        it('should create memory with tags', async () => {
            const app = getMemoryApp()
            const res = await app.request('/', {
                method: 'POST',
                body: JSON.stringify({ id: 'tagged-1', content: 'Tagged content', tags: ['important', 'work'] }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(201)
            const memory = await res.json()
            expect(memory.tags).toEqual(['important', 'work'])
        })

        it('should return 400 for missing content', async () => {
            const app = getMemoryApp()
            const res = await app.request('/', {
                method: 'POST',
                body: JSON.stringify({ id: 'no-content' }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(400)
        })
    })

    describe('PUT /:id', () => {
        it('should update memory title', async () => {
            const app = getMemoryApp()
            await createMemory({ id: 'update-1', title: 'Original', content: 'Content' })

            const res = await app.request('/update-1', {
                method: 'PUT',
                body: JSON.stringify({ title: 'Updated Title' }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(200)
            const memory = await res.json()
            expect(memory.title).toBe('Updated Title')
            expect(memory.content).toBe('Content')
        })

        it('should update memory content', async () => {
            const app = getMemoryApp()
            await createMemory({ id: 'update-2', content: 'Original content' })

            const res = await app.request('/update-2', {
                method: 'PUT',
                body: JSON.stringify({ content: 'Updated content' }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(200)
            const memory = await res.json()
            expect(memory.content).toBe('Updated content')
        })

        it('should update memory tags', async () => {
            const app = getMemoryApp()
            await createMemory({ id: 'update-3', content: 'Content', tags: ['old'] })

            const res = await app.request('/update-3', {
                method: 'PUT',
                body: JSON.stringify({ tags: ['new', 'updated'] }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(200)
            const memory = await res.json()
            expect(memory.tags).toEqual(['new', 'updated'])
        })

        it('should return 404 when updating non-existent memory', async () => {
            const app = getMemoryApp()
            const res = await app.request('/non-existent', {
                method: 'PUT',
                body: JSON.stringify({ content: 'Updated' }),
                headers: { 'Content-Type': 'application/json' },
            })
            expect(res.status).toBe(404)
        })
    })

    describe('DELETE /:id', () => {
        it('should delete existing memory', async () => {
            const app = getMemoryApp()
            await createMemory({ id: 'delete-1', content: 'To be deleted' })

            const res = await app.request('/delete-1', { method: 'DELETE' })
            expect(res.status).toBe(204)

            const getRes = await app.request('/delete-1')
            expect(getRes.status).toBe(404)
        })

        it('should return 404 when deleting non-existent memory', async () => {
            const app = getMemoryApp()
            const res = await app.request('/non-existent', { method: 'DELETE' })
            expect(res.status).toBe(404)
        })
    })
})