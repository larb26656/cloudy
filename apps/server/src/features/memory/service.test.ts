import { mock, MockProxy } from 'vitest-mock-extended';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryService } from './service';
import type { MemoryRepository, MemoryRecordDTO } from './repository';
import { HTTPException } from 'hono/http-exception';

describe('MemoryService', () => {
  let service: MemoryService;
  let mockRepository: MockProxy<MemoryRepository>;

  beforeEach(() => {
    mockRepository = mock<MemoryRepository>();
    service = new MemoryService(mockRepository);
  });

  describe('listMemories', () => {
    it('should return all memories', async () => {
      // Arrange
      const mockMemories: MemoryRecordDTO[] = [
        {
          id: '1',
          title: 'Test Memory',
          content: 'Test content',
          tags: ['test'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockRepository.findAll.mockResolvedValue(mockMemories);

      // Act
      const result = await service.listMemories();

      // Assert
      expect(result).toEqual(mockMemories);
      expect(mockRepository.findAll).toHaveBeenCalledOnce();
    });

    it('should pass query to repository', async () => {
      // Arrange
      const query = { tags: ['work'], q: 'keyword' };
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      await service.listMemories(query);

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getMemory', () => {
    it('should return memory when found', async () => {
      // Arrange
      const mockMemory: MemoryRecordDTO = {
        id: '1',
        title: 'Test Memory',
        content: 'Test content',
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mockRepository.findById.mockResolvedValue(mockMemory);

      // Act
      const result = await service.getMemory('1');

      // Assert
      expect(result).toEqual(mockMemory);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw when memory not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMemory('1')).rejects.toBeInstanceOf(HTTPException);
      await expect(service.getMemory('1')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('createMemory', () => {
    it('should create and return memory', async () => {
      // Arrange
      const input = { id: '1', title: 'New Memory', content: 'New content', tags: ['new'] };
      const mockMemory: MemoryRecordDTO = {
        id: '1',
        title: 'New Memory',
        content: 'New content',
        tags: ['new'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mockRepository.create.mockResolvedValue(mockMemory);

      // Act
      const result = await service.createMemory(input);

      // Assert
      expect(result).toEqual(mockMemory);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateMemory', () => {
    it('should update and return memory', async () => {
      // Arrange
      const input = { title: 'Updated Title' };
      const mockMemory: MemoryRecordDTO = {
        id: '1',
        title: 'Updated Title',
        content: 'content',
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };
      mockRepository.findById.mockResolvedValue(mockMemory);
      mockRepository.update.mockResolvedValue(mockMemory);

      // Act
      const result = await service.updateMemory('1', input);

      // Assert
      expect(result).toEqual(mockMemory);
      expect(mockRepository.update).toHaveBeenCalledWith('1', input);
    });

    it('should throw when memory not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateMemory('1', { title: 'Updated' })).rejects.toBeInstanceOf(HTTPException);
      await expect(service.updateMemory('1', { title: 'Updated' })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('deleteMemory', () => {
    it('should call repository delete', async () => {
      // Arrange
      const mockMemory: MemoryRecordDTO = {
        id: '1',
        title: 'Test Memory',
        content: 'content',
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mockRepository.findById.mockResolvedValue(mockMemory);
      mockRepository.delete.mockResolvedValue();

      // Act
      await service.deleteMemory('1');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw when memory not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteMemory('1')).rejects.toBeInstanceOf(HTTPException);
      await expect(service.deleteMemory('1')).rejects.toMatchObject({ status: 404 });
    });
  });
});