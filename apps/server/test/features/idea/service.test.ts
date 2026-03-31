import { describe, test, expect, beforeEach } from 'bun:test';
import { mockFn, type MockProxy } from 'bun-automock';
import { Idea } from '../../../src/features/idea/service';
import type { IdeaRecord } from '../../../src/features/idea/types';
import type { IdeaRepository } from '../../../src/features/idea/repository';
import type { IdeaFile } from '../../../src/features/idea/file/service';

const mockIdeaRecord: IdeaRecord = {
    id: 'idea-123',
    title: 'Test Idea',
    path: 'test-idea/index.md',
    status: 'draft',
    priority: 'medium',
    tags: ['test', 'idea'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

const mockFileMeta = {
    name: 'index.md',
    path: 'test-idea/index.md',
    size: 100,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
};

describe('IdeaService', () => {
    let repository: MockProxy<IdeaRepository>;
    let ideaFile: MockProxy<IdeaFile>;
    let service: Idea;

    beforeEach(() => {
        repository = mockFn<IdeaRepository>();
        ideaFile = mockFn<IdeaFile>();
        service = new Idea(repository, ideaFile);
    });

    describe('listIdeas', () => {
        test('should_return_list_of_ideas', async () => {
            // Arrange
            repository.findAll.mockResolvedValue([mockIdeaRecord]);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: mockIdeaRecord.path, content: '# Test Idea' });

            // Act
            const result = await service.listIdeas();

            // Assert

            const first = result[0]!;
            expect(result.length).toBe(1);
            expect(first.name).toBe('test-idea');
            expect(first.path).toBe('test-idea/index.md');
            expect(first.content).toBe('# Test Idea');
            expect(first.meta.title).toBe('Test Idea');
            expect(first.meta.status).toBe('draft');
            expect(first.meta.priority).toBe('medium');
            expect(first.meta.tags).toEqual(['test', 'idea']);
        });

        test('should_skip_ideas_when_file_not_found', async () => {
            // Arrange
            repository.findAll.mockResolvedValue([mockIdeaRecord]);
            ideaFile.getFile.mockRejectedValue(new Error('File not found'));

            // Act
            const result = await service.listIdeas();

            // Assert
            expect(result.length).toBe(0);
        });

        test('should_pass_status_filter_to_repository', async () => {
            // Arrange
            repository.findAll.mockResolvedValue([mockIdeaRecord]);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: mockIdeaRecord.path, content: '# Test' });

            // Act
            await service.listIdeas({ status: 'draft' });

            // Assert
            expect(repository.findAll.spy()).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'draft' })
            );
        });

        test('should_pass_priority_filter_to_repository', async () => {
            // Arrange
            repository.findAll.mockResolvedValue([mockIdeaRecord]);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: mockIdeaRecord.path, content: '# Test' });

            // Act
            await service.listIdeas({ priority: 'high' });

            // Assert
            expect(repository.findAll.spy()).toHaveBeenCalledWith(
                expect.objectContaining({ priority: 'high' })
            );
        });

        test('should_pass_tags_filter_to_repository', async () => {
            // Arrange
            repository.findAll.mockResolvedValue([mockIdeaRecord]);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: mockIdeaRecord.path, content: '# Test' });

            // Act
            await service.listIdeas({ tags: ['test'] });

            // Assert
            expect(repository.findAll.spy()).toHaveBeenCalledWith(
                expect.objectContaining({ tags: ['test'] })
            );
        });

        test('should_pass_query_search_to_repository', async () => {
            // Arrange
            repository.findAll.mockResolvedValue([mockIdeaRecord]);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: mockIdeaRecord.path, content: '# Test' });

            // Act
            await service.listIdeas({ q: 'test' });

            // Assert
            expect(repository.findAll.spy()).toHaveBeenCalledWith(
                expect.objectContaining({ q: 'test' })
            );
        });
    });

    describe('createIdea', () => {
        test('should_create_folder_and_index_file', async () => {
            // Arrange
            repository.exists.mockResolvedValue(false);
            ideaFile.createIdeaDirectory.mockResolvedValue();
            repository.create.mockResolvedValue(mockIdeaRecord);
            repository.findByPath.mockResolvedValue(mockIdeaRecord);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: 'new-idea/index.md', content: '# New Idea' });
            ideaFile.listIdeaFiles.mockResolvedValue([mockFileMeta]);

            // Act
            const result = await service.createIdea('new-idea');

            // Assert
            expect(ideaFile.createIdeaDirectory.spy()).toHaveBeenCalledWith('new-idea');
            expect(repository.create.spy()).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'new-idea',
                    path: 'new-idea/index.md',
                    status: 'draft',
                    priority: 'medium',
                })
            );
            expect(ideaFile.getFile.spy()).toHaveBeenCalledWith('new-idea/index.md');
            expect(repository.findByPath.spy()).toHaveBeenCalledWith('new-idea/index.md');
            expect(ideaFile.listIdeaFiles.spy()).toHaveBeenCalledWith('new-idea');
            expect(result.name).toBe('new-idea');
        });

        test('should_throw_400_when_idea_already_exists', async () => {
            // Arrange
            repository.exists.mockResolvedValue(true);

            // Act & Assert
            await expect(service.createIdea('existing-idea')).rejects.toMatchObject({ code: 400 });
        });
    });

    describe('deleteIdea', () => {
        test('should_delete_folder_and_database_record', async () => {
            // Arrange
            repository.exists.mockResolvedValue(true);
            ideaFile.deleteIdeaDirectory.mockResolvedValue();
            repository.deleteByPath.mockResolvedValue();

            // Act
            const result = await service.deleteIdea('test-idea');

            // Assert
            expect(result).toEqual({ success: true });
            expect(ideaFile.deleteIdeaDirectory.spy()).toHaveBeenCalledWith('test-idea');
            expect(repository.deleteByPath.spy()).toHaveBeenCalledWith('test-idea/index.md');
        });

        test('should_throw_404_when_idea_not_found', async () => {
            // Arrange
            repository.exists.mockResolvedValue(false);

            // Act & Assert
            await expect(service.deleteIdea('non-existent')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('getIdea', () => {
        test('should_read_file_and_return_idea_with_meta', async () => {
            // Arrange
            repository.findByPath.mockResolvedValue(mockIdeaRecord);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: 'test-idea/index.md', content: '# Test Content' });
            ideaFile.listIdeaFiles.mockResolvedValue([mockFileMeta]);

            // Act
            const result = await service.getIdea('test-idea/some-file.md');

            // Assert
            expect(ideaFile.getFile.spy()).toHaveBeenCalledWith('test-idea/index.md');
            expect(ideaFile.listIdeaFiles.spy()).toHaveBeenCalledWith('test-idea');
            expect(result.name).toBe('test-idea');
            expect(result.content).toBe('# Test Content');
            expect(result.meta.title).toBe('Test Idea');
        });

        test('should_throw_404_when_idea_file_not_found', async () => {
            // Arrange
            repository.findByPath.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getIdea('non-existent/index.md')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('patchMeta', () => {
        test('should_update_metadata_in_repository', async () => {
            // Arrange
            const updatedRecord = {
                ...mockIdeaRecord,
                title: 'Updated Title',
                status: 'in-progress' as const,
            };
            repository.findByPath.mockResolvedValue(updatedRecord);
            repository.updateByPath.mockResolvedValue(updatedRecord);
            ideaFile.getFile.mockResolvedValue({ name: 'index.md', path: 'test-idea/index.md', content: '# Test Content' });
            ideaFile.listIdeaFiles.mockResolvedValue([mockFileMeta]);

            // Act
            const result = await service.patchMeta('test-idea', { title: 'Updated Title', status: 'in-progress' });

            // Assert
            expect(repository.updateByPath.spy()).toHaveBeenCalledWith(
                'test-idea/index.md',
                expect.objectContaining({ title: 'Updated Title', status: 'in-progress' })
            );
            expect(ideaFile.getFile.spy()).toHaveBeenCalledWith('test-idea/index.md');
            expect(result.meta!.title).toBe('Updated Title');
        });

        test('should_throw_404_when_idea_not_found', async () => {
            // Arrange
            repository.findByPath.mockResolvedValue(null);

            // Act & Assert
            await expect(service.patchMeta('non-existent', { title: 'New' })).rejects.toMatchObject({ code: 404 });
        });
    });
});