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

  const createListQuery = (result: {
    data: unknown;
    error: Error | null;
    count?: number | null;
  }) => {
    const query = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve(
          onFulfilled({
            data: result.data,
            error: result.error,
            count: result.count ?? null,
          }),
        ),
    };

    return query;
  };

  const createProgramQuery = (result: {
    data: unknown;
    error: Error | null;
  }) => {
    const query = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      then: (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve(
          onFulfilled({
            data: result.data,
            error: result.error,
          }),
        ),
    };

    return query;
  };

  const createCohortQuery = (result: {
    data: unknown;
    error: Error | null;
  }) => {
    const query = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve(
          onFulfilled({
            data: result.data,
            error: result.error,
          }),
        ),
    };

    return query;
  };

  describe('listResources', () => {
    it('Given default options, When listResources is called, Then it returns a paginated list of published resources', async () => {
      const mockClient = createListQuery({
        data: [mockResourceRow],
        error: null,
        count: 1,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.listResources();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockResourceDto);
      expect(result.total).toBe(1);
    });

    it('Given filters and out-of-range pagination, When listResources is called, Then it applies filters and pagination boundaries', async () => {
      const mockClient = createListQuery({
        data: [mockResourceRow],
        error: null,
        count: 1,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await service.listResources({
        programId: 'prog-001',
        resourceTheme: 'training',
        resourceAudience: 'all',
        page: 0,
        limit: 1000,
      });

      expect(mockClient.eq).toHaveBeenCalledWith('program_id', 'prog-001');
      expect(mockClient.eq).toHaveBeenCalledWith('resource_theme', 'training');
      expect(mockClient.eq).toHaveBeenCalledWith('resource_audience', 'all');
      expect(mockClient.range).toHaveBeenCalledWith(0, 99);
    });

    it('Given an empty payload with null count, When listResources is called, Then it returns an empty list with total 0', async () => {
      const mockClient = createListQuery({
        data: null,
        error: null,
        count: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.listResources();

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('Given a query failure, When listResources is called, Then it throws an explicit list error', async () => {
      const mockClient = createListQuery({
        data: null,
        error: new Error('Database connection failed'),
        count: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.listResources()).rejects.toThrow(
        'Failed to list resources',
      );
    });
  });

  describe('getResourceById', () => {
    it('Given an existing published resource id, When getResourceById is called, Then it returns the mapped resource', async () => {
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

    it('Given an unknown id with error, When getResourceById is called, Then it throws NotFoundException', async () => {
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

    it('Given a missing row without query error, When getResourceById is called, Then it throws NotFoundException', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.getResourceById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getResourcesByProgram', () => {
    it('Given a program id only, When getResourcesByProgram is called, Then it returns program-level resources', async () => {
      const programQuery = createProgramQuery({
        data: [mockResourceRow],
        error: null,
      });
      const mockClient = {
        from: jest.fn().mockImplementation(() => programQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getResourcesByProgram('prog-001');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockResourceDto);
    });

    it('Given program and cohort data with duplicates, When getResourcesByProgram is called, Then it merges, deduplicates and sorts by publishedAt desc', async () => {
      const programRow = {
        ...mockResourceRow,
        id: 'res-100',
        published_at: '2026-04-18T10:00:00Z',
      };
      const duplicatedRow = {
        ...mockResourceRow,
        id: 'res-101',
        published_at: '2026-04-17T10:00:00Z',
      };
      const cohortNewerRow = {
        ...mockResourceRow,
        id: 'res-102',
        published_at: '2026-04-21T10:00:00Z',
        cohort_id: 'coh-001',
      };
      const cohortNullDateRow = {
        ...mockResourceRow,
        id: 'res-103',
        published_at: null,
        cohort_id: 'coh-001',
      };

      const programQuery = createProgramQuery({
        data: [programRow, duplicatedRow],
        error: null,
      });
      const cohortQuery = createCohortQuery({
        data: [duplicatedRow, cohortNewerRow, cohortNullDateRow],
        error: null,
      });

      const mockClient = {
        from: jest
          .fn()
          .mockImplementationOnce(() => programQuery)
          .mockImplementationOnce(() => cohortQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getResourcesByProgram(
        'prog-001',
        'coh-001',
        {
          resourceTheme: 'training',
          resourceAudience: 'all',
        },
      );

      expect(programQuery.eq).toHaveBeenCalledWith(
        'resource_theme',
        'training',
      );
      expect(programQuery.eq).toHaveBeenCalledWith('resource_audience', 'all');
      expect(cohortQuery.eq).toHaveBeenCalledWith('resource_theme', 'training');
      expect(cohortQuery.eq).toHaveBeenCalledWith('resource_audience', 'all');

      expect(result.map((resource) => resource.id)).toEqual([
        'res-102',
        'res-100',
        'res-101',
        'res-103',
      ]);
    });

    it('Given more than 50 merged resources, When getResourcesByProgram is called, Then it returns at most 50 resources', async () => {
      const programRows = Array.from({ length: 35 }, (_, index) => ({
        ...mockResourceRow,
        id: `prog-${index}`,
        published_at: `2026-04-${String(10 + index).padStart(2, '0')}T10:00:00Z`,
      }));
      const cohortRows = Array.from({ length: 35 }, (_, index) => ({
        ...mockResourceRow,
        id: `coh-${index}`,
        cohort_id: 'coh-001',
        published_at: `2026-05-${String(1 + index).padStart(2, '0')}T10:00:00Z`,
      }));

      const programQuery = createProgramQuery({
        data: programRows,
        error: null,
      });
      const cohortQuery = createCohortQuery({
        data: cohortRows,
        error: null,
      });
      const mockClient = {
        from: jest
          .fn()
          .mockImplementationOnce(() => programQuery)
          .mockImplementationOnce(() => cohortQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.getResourcesByProgram('prog-001', 'coh-001');

      expect(result).toHaveLength(50);
    });

    it('Given a failure on program query, When getResourcesByProgram is called, Then it throws an explicit program error', async () => {
      const programQuery = createProgramQuery({
        data: null,
        error: new Error('Program query failure'),
      });
      const mockClient = {
        from: jest.fn().mockImplementation(() => programQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.getResourcesByProgram('prog-001')).rejects.toThrow(
        'Failed to fetch program resources',
      );
    });

    it('Given a failure on cohort query, When getResourcesByProgram is called with cohortId, Then it throws an explicit cohort error', async () => {
      const programQuery = createProgramQuery({
        data: [mockResourceRow],
        error: null,
      });
      const cohortQuery = createCohortQuery({
        data: null,
        error: new Error('Cohort query failure'),
      });
      const mockClient = {
        from: jest
          .fn()
          .mockImplementationOnce(() => programQuery)
          .mockImplementationOnce(() => cohortQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(
        service.getResourcesByProgram('prog-001', 'coh-001'),
      ).rejects.toThrow('Failed to fetch cohort resources');
    });
  });
});
