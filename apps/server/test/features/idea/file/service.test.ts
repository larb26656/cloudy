import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mockFn, type MockProxy } from 'bun-automock';
import { IdeaFile } from '../../../../src/features/idea/file/service';
import type { IdeaRepository } from '../../../../src/features/idea/repository';
import { loadConfig } from '../../../../src/config';
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const config = loadConfig();

async function folderExists(path: string): Promise<boolean> {
    try {
        const s = await stat(path);
        return s.isDirectory();
    } catch {
        return false;
    }
}

describe('IdeaFileService', () => {
    let ideaRepository: MockProxy<IdeaRepository>;
    let service: IdeaFile;
    const testIdeaPath = resolve(config.idea, 'test-getfile-idea');

    beforeEach(async () => {
        ideaRepository = mockFn<IdeaRepository>();
        service = new IdeaFile(ideaRepository, config);
        await mkdir(testIdeaPath, { recursive: true });
        await writeFile(resolve(testIdeaPath, 'test.md'), 'test content');
        await writeFile(resolve(testIdeaPath, 'index.md'), '# Index');
    });

    afterEach(async () => {
        await rm(testIdeaPath, { recursive: true, force: true });
        await rm(resolve(config.idea, 'test-idea'), { recursive: true, force: true });
    });

    describe('getFile', () => {
        test('should_return_file_content_when_file_exists', async () => {
            // Act
            const result = await service.getFile('test-getfile-idea/test.md');

            // Assert
            expect(result.name).toBe('test.md');
            expect(result.path).toBe('test-getfile-idea/test.md');
            expect(result.content).toBe('test content');
        });

        test('should_throw_404_when_file_does_not_exist', async () => {
            // Act & Assert
            await expect(service.getFile('nonexistent-idea/file.md')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('createFile', () => {
        test('should_create_file_and_return_correct_response', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);

            // Act
            const result = await service.createFile('test-getfile-idea', 'new-file.md', 'new content');

            // Assert
            expect(result.name).toBe('new-file.md');
            expect(result.path).toBe('test-getfile-idea/new-file.md');
            expect(result.content).toBe('new content');

            // Assert file was actually created
            const file = Bun.file(resolve(config.idea, 'test-getfile-idea', 'new-file.md'));
            expect(await file.exists()).toBe(true);
            expect(await file.text()).toBe('new content');

            // Assert touchUpdatedAt was called
            expect(ideaRepository.touchUpdatedAt.spy()).toHaveBeenCalledWith('test-getfile-idea');

            // Cleanup
            await rm(resolve(config.idea, 'test-getfile-idea', 'new-file.md'));
        });

        test('should_throw_404_when_idea_not_found', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(false);

            // Act & Assert
            await expect(service.createFile('nonexistent-idea', 'file.md', '')).rejects.toMatchObject({ code: 404 });
        });

        test('should_throw_404_when_idea_folder_does_not_exist', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);

            // Act & Assert
            await expect(service.createFile('test-idea', 'file.md', '')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('updateFile', () => {
        test('should_update_file_and_return_correct_response', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);
            const filePath = resolve(testIdeaPath, 'test.md');

            // Act
            const result = await service.updateFile('test-getfile-idea/test.md', 'updated content');

            // Assert
            expect(result.name).toBe('test.md');
            expect(result.path).toBe('test-getfile-idea/test.md');
            expect(result.content).toBe('updated content');

            // Assert file was actually updated
            const file = Bun.file(filePath);
            expect(await file.text()).toBe('updated content');

            // Assert touchUpdatedAt was called
            expect(ideaRepository.touchUpdatedAt.spy()).toHaveBeenCalledWith('test-getfile-idea');
        });

        test('should_throw_404_when_idea_not_found', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(false);

            // Act & Assert
            await expect(service.updateFile('nonexistent-idea/test.md', 'content')).rejects.toMatchObject({ code: 404 });
        });

        test('should_throw_404_when_file_does_not_exist', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);

            // Act & Assert
            await expect(service.updateFile('test-idea/nonexistent.md', 'content')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('deleteFile', () => {
        test('should_delete_file_and_return_success', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);
            const filePath = resolve(testIdeaPath, 'test.md');
            expect(await Bun.file(filePath).exists()).toBe(true);

            // Act
            const result = await service.deleteFile('test-getfile-idea/test.md');

            // Assert
            expect(result).toEqual({ success: true });
            expect(await Bun.file(filePath).exists()).toBe(false);

            // Assert touchUpdatedAt was called
            expect(ideaRepository.touchUpdatedAt.spy()).toHaveBeenCalledWith('test-getfile-idea');
        });

        test('should_throw_400_when_deleting_index_md', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);

            // Act & Assert
            await expect(service.deleteFile('test-getfile-idea/index.md')).rejects.toMatchObject({ code: 400 });
        });

        test('should_throw_404_when_idea_not_found', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(false);

            // Act & Assert
            await expect(service.deleteFile('nonexistent-idea/test.md')).rejects.toMatchObject({ code: 404 });
        });

        test('should_throw_404_when_file_does_not_exist', async () => {
            // Arrange
            ideaRepository.exists.mockResolvedValue(true);

            // Act & Assert
            await expect(service.deleteFile('test-idea/nonexistent.md')).rejects.toMatchObject({ code: 404 });
        });
    });

    describe('createIdeaDirectory', () => {
        const newIdeaPath = 'create-dir-test-idea';
        const newIdeaFolder = resolve(config.idea, newIdeaPath);

        afterEach(async () => {
            await rm(newIdeaFolder, { recursive: true, force: true });
        });

        test('should_create_directory_and_index_md', async () => {
            // Act
            await service.createIdeaDirectory(newIdeaPath);

            // Assert - verify folder and index.md exist
            expect(await folderExists(newIdeaFolder)).toBe(true);
            expect(await Bun.file(resolve(newIdeaFolder, 'index.md')).exists()).toBe(true);
        });

        test('should_throw_400_when_folder_already_exists', async () => {
            // Arrange - create the folder first
            await mkdir(newIdeaFolder, { recursive: true });

            // Act & Assert
            await expect(service.createIdeaDirectory(newIdeaPath)).rejects.toMatchObject({ code: 400 });
        });
    });

    describe('deleteIdeaDirectory', () => {
        const deleteTestFolder = resolve(config.idea, 'delete-dir-test-idea');

        beforeEach(async () => {
            await mkdir(deleteTestFolder, { recursive: true });
        });

        afterEach(async () => {
            await rm(deleteTestFolder, { recursive: true, force: true });
        });

        test('should_delete_directory', async () => {
            // Verify folder exists before delete
            expect(await folderExists(deleteTestFolder)).toBe(true);

            // Act
            await service.deleteIdeaDirectory('delete-dir-test-idea');

            // Assert - folder should be gone
            expect(await folderExists(deleteTestFolder)).toBe(false);
        });

        test('should_not_throw_when_folder_does_not_exist', async () => {
            // Act & Assert - should not throw
            await expect(service.deleteIdeaDirectory('nonexistent-idea')).resolves.toBeUndefined();
        });
    });

    describe('listIdeaFiles', () => {
        test('should_return_sorted_files_with_index_first', async () => {
            // Act
            const result = await service.listIdeaFiles('test-getfile-idea');

            // Assert
            expect(result.length).toBe(2);
            expect(result[0].name).toBe('index.md');
            expect(result[1].name).toBe('test.md');
        });

        test('should_return_empty_array_when_folder_empty', async () => {
            // Arrange
            const emptyFolder = resolve(config.idea, 'empty-idea');
            await mkdir(emptyFolder, { recursive: true });

            // Act
            const result = await service.listIdeaFiles('empty-idea');

            // Assert
            expect(result).toEqual([]);

            // Cleanup
            await rm(emptyFolder, { recursive: true, force: true });
        });

        test('should_return_empty_array_when_folder_not_exist', async () => {
            // Act
            const result = await service.listIdeaFiles('nonexistent-idea');

            // Assert
            expect(result).toEqual([]);
        });
    });
});