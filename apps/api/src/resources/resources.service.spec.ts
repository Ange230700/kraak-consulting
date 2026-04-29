import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { ResourceDto } from '@kraak/contracts';

describe('ResourcesService', () => {
  let service: ResourcesService;

  const mockResourceRow = {
    id: 'res-001',
    program_id: 'prog-001',
    cohort_id: null,
    title: 'TypeScript Basics',
    description: 'Learn TypeScript fundamentals',
    resource_type: 'video' as const,
    resource_theme: 'training' as const,
    resource_audience: 'all' as const,
    url: 'https://example.com/ts-basics',
    file_path: null,
    status: 'published' as const,
    published_at: '2026-04-20T10:00:00Z',
    created_at: '2026-04-19T10:00:00Z',
    updated_at: '2026-04-20T10:00:00Z',
  };

  const mockResourceDto: ResourceDto = {
    id: 'res-001',
    programId: 'prog-001',
    cohortId: null,
    title: 'TypeScript Basics',
    description: 'Learn TypeScript fundamentals',
    resourceType: 'video',
    resourceTheme: 'training',
    resourceAudience: 'all',
    url: 'https://example.com/ts-basics',
    filePath: null,
    status: 'published',
    publishedAt: '2026-04-20T10:00:00Z',
    createdAt: '2026-04-19T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  };

  const mockSupabaseService = {
    getClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listResources', () => {
    it('should return paginated list of published resources', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [mockResourceRow],
          error: null,
          count: 1,
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.listResources();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockResourceDto);
      expect(result.total).toBe(1);
    });

    it('should handle query errors gracefully', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
          count: null,
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.listResources()).rejects.toThrow(
        'Failed to list resources',
      );
    });
  });

  describe('getResourceById', () => {
    it('should return resource by ID', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockResourceRow,
          error: null,
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getResourceById('res-001');

      expect(result).toEqual(mockResourceDto);
    });

    it('should throw NotFoundException when resource not found', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.getResourceById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getResourcesByProgram', () => {
    it('should return resources for a program', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          data: [mockResourceRow],
          error: null,
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getResourcesByProgram('prog-001');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockResourceDto);
    });
  });
});
