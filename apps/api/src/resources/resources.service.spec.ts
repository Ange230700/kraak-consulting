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

  const createAsyncQuery = <TResult extends object>(
    terminalResult: TResult,
    options?: { withOrder?: boolean; withRange?: boolean; withIs?: boolean },
  ) => {
    const base = Promise.resolve(
      terminalResult,
    ) as unknown as Promise<TResult> & {
      from: ReturnType<typeof jest.fn>;
      select: ReturnType<typeof jest.fn>;
      eq: ReturnType<typeof jest.fn>;
      is?: ReturnType<typeof jest.fn>;
      order?: ReturnType<typeof jest.fn>;
      range?: ReturnType<typeof jest.fn>;
    };

    base.from = jest.fn().mockReturnValue(base);
    base.select = jest.fn().mockReturnValue(base);
    base.eq = jest.fn().mockReturnValue(base);

    if (options?.withIs) {
      base.is = jest.fn().mockReturnValue(base);
    }

    if (options?.withOrder) {
      base.order = jest.fn().mockReturnValue(base);
    }

    if (options?.withRange) {
      base.range = jest.fn().mockReturnValue(base);
    }

    return base;
  };

  const createListQuery = (result: {
    data: unknown;
    error: Error | null;
    count?: number | null;
  }) =>
    createAsyncQuery(
      {
        data: result.data,
        error: result.error,
        count: result.count ?? null,
      },
      { withOrder: true, withRange: true, withIs: true },
    );

  const createProgramQuery = (result: { data: unknown; error: Error | null }) =>
    createAsyncQuery(
      {
        data: result.data,
        error: result.error,
      },
      { withIs: true },
    );

  const createCohortQuery = (result: { data: unknown; error: Error | null }) =>
    createAsyncQuery({
      data: result.data,
      error: result.error,
    });

  const createTrackingSelectQuery = (result: {
    data: unknown;
    error: Error | null;
  }) => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: result.data,
      error: result.error,
    }),
  });

  const createTrackingUpdateQuery = (result: { error: Error | null }) => {
    const query = createAsyncQuery({
      error: result.error,
    }) as ReturnType<typeof createAsyncQuery> & {
      update: ReturnType<typeof jest.fn>;
    };

    query.update = jest.fn().mockReturnValue(query);

    return query;
  };

  const createResourceMutationQuery = (result: {
    data: unknown;
    error: Error | null;
    count?: number | null;
  }) => {
    const query = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: result.data,
        error: result.error,
      }),
    };

    return {
      from: jest.fn().mockReturnValue(query),
      ...query,
    };
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

    it('Given a query failure, When listResources is called, Then it returns an empty public payload', async () => {
      const mockClient = createListQuery({
        data: null,
        error: new Error('Database connection failed'),
        count: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.listResources()).resolves.toEqual({
        data: [],
        total: 0,
      });
    });
  });

  describe('listAllResources', () => {
    it('Given admin filters, When listAllResources is called, Then unpublished resources are also returned', async () => {
      const mockClient = createListQuery({
        data: [mockResourceRow],
        error: null,
        count: 1,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result = await service.listAllResources({
        programId: 'prog-001',
        resourceTheme: 'training',
        resourceAudience: 'all',
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockClient.eq).not.toHaveBeenCalledWith('status', 'published');
    });

    it('Given an admin query failure, When listAllResources is called, Then it throws an explicit internal error', async () => {
      const mockClient = createListQuery({
        data: null,
        error: new Error('DB unavailable'),
        count: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.listAllResources()).rejects.toThrow(
        'Failed to fetch resources.',
      );
    });

    it('Given null data and null count, When listAllResources is called, Then it returns an empty payload with total 0', async () => {
      const mockClient = createListQuery({
        data: null,
        error: null,
        count: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.listAllResources()).resolves.toEqual({
        data: [],
        total: 0,
      });
    });
  });

  describe('create/update/delete resource', () => {
    it('Given un payload création, When createResource is called, Then the resource is inserted', async () => {
      const mutationClient = createResourceMutationQuery({
        data: mockResourceRow,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mutationClient);

      await expect(
        service.createResource({
          programId: null,
          cohortId: null,
          title: 'TypeScript Basics',
          description: 'Learn TypeScript fundamentals',
          resourceType: 'video',
          resourceTheme: 'training',
          resourceAudience: 'all',
          url: 'https://example.com/ts-basics',
          filePath: null,
          status: 'published',
          publishedAt: null,
        }),
      ).resolves.toEqual(mockResourceDto);

      expect(mutationClient.insert).toHaveBeenCalledWith({
        program_id: null,
        cohort_id: null,
        title: 'TypeScript Basics',
        description: 'Learn TypeScript fundamentals',
        resource_type: 'video',
        resource_theme: 'training',
        resource_audience: 'all',
        url: 'https://example.com/ts-basics',
        file_path: null,
        status: 'published',
        published_at: expect.any(String),
      });
    });

    it('Given un payload mise à jour, When updateResource is called, Then the resource is updated', async () => {
      const mutationClient = createResourceMutationQuery({
        data: mockResourceRow,
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mutationClient);

      await expect(
        service.updateResource('res-001', {
          title: 'TypeScript Basics',
          status: 'published',
        }),
      ).resolves.toEqual(mockResourceDto);

      expect(mutationClient.update).toHaveBeenCalledWith({
        title: 'TypeScript Basics',
        status: 'published',
        published_at: expect.any(String),
      });
      expect(mutationClient.eq).toHaveBeenCalledWith('id', 'res-001');
    });

    it('Given a resource id, When deleteResource is called, Then the resource is archived', async () => {
      const mutationClient = createResourceMutationQuery({
        data: { id: 'res-001' },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mutationClient);

      await expect(service.deleteResource('res-001')).resolves.toBeUndefined();

      expect(mutationClient.update).toHaveBeenCalledWith({
        status: 'archived',
        published_at: null,
      });
    });

    it('Given an explicit publishedAt value, When createResource is called, Then published_at keeps the provided timestamp', async () => {
      const mutationClient = createResourceMutationQuery({
        data: {
          ...mockResourceRow,
          published_at: '2026-04-22T09:00:00Z',
          status: 'draft',
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mutationClient);

      await expect(
        service.createResource({
          programId: 'prog-001',
          cohortId: null,
          title: 'Draft Resource',
          description: 'Draft description',
          resourceType: 'video',
          resourceTheme: 'training',
          resourceAudience: 'all',
          url: 'https://example.com/draft-resource',
          filePath: null,
          status: 'draft',
          publishedAt: '2026-04-22T09:00:00Z',
        }),
      ).resolves.toMatchObject({ id: 'res-001' });

      expect(mutationClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
          published_at: '2026-04-22T09:00:00Z',
        }),
      );
    });

    it('Given a full update payload without status, When updateResource is called, Then all optional fields are propagated and published_at comes from payload', async () => {
      const mutationClient = createResourceMutationQuery({
        data: {
          ...mockResourceRow,
          cohort_id: 'coh-001',
          title: 'Updated Full Resource',
          description: 'Updated description',
          resource_type: 'document',
          resource_theme: 'immigration',
          resource_audience: 'international_candidates',
          url: 'https://example.com/updated',
          file_path: 'files/updated.pdf',
          published_at: '2026-04-25T10:00:00Z',
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mutationClient);

      await expect(
        service.updateResource('res-001', {
          programId: 'prog-002',
          cohortId: 'coh-001',
          title: 'Updated Full Resource',
          description: 'Updated description',
          resourceType: 'document',
          resourceTheme: 'immigration',
          resourceAudience: 'international_candidates',
          url: 'https://example.com/updated',
          filePath: 'files/updated.pdf',
          publishedAt: '2026-04-25T10:00:00Z',
        }),
      ).resolves.toMatchObject({
        id: 'res-001',
        title: 'Updated Full Resource',
      });

      expect(mutationClient.update).toHaveBeenCalledWith({
        program_id: 'prog-002',
        cohort_id: 'coh-001',
        title: 'Updated Full Resource',
        description: 'Updated description',
        resource_type: 'document',
        resource_theme: 'immigration',
        resource_audience: 'international_candidates',
        url: 'https://example.com/updated',
        file_path: 'files/updated.pdf',
        published_at: '2026-04-25T10:00:00Z',
      });
    });

    it('Given a draft status without explicit publishedAt, When updateResource is called, Then published_at is set to null', async () => {
      const mutationClient = createResourceMutationQuery({
        data: {
          ...mockResourceRow,
          status: 'draft',
          published_at: null,
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(mutationClient);

      await expect(
        service.updateResource('res-001', {
          status: 'draft',
          title: 'Draft title',
        }),
      ).resolves.toMatchObject({ id: 'res-001', status: 'draft' });

      expect(mutationClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
          title: 'Draft title',
          published_at: null,
        }),
      );
    });

    it('Given null data without query error, When create/update/delete resource are called, Then create throws InternalServerErrorException and update/delete throw NotFoundException', async () => {
      mockSupabaseService.getClient
        .mockReturnValueOnce(
          createResourceMutationQuery({
            data: null,
            error: null,
          }),
        )
        .mockReturnValueOnce(
          createResourceMutationQuery({
            data: null,
            error: null,
          }),
        )
        .mockReturnValueOnce(
          createResourceMutationQuery({
            data: null,
            error: null,
          }),
        );

      await expect(
        service.createResource({
          programId: null,
          cohortId: null,
          title: 'x',
          description: 'x',
          resourceType: 'video',
          resourceTheme: 'training',
          resourceAudience: 'all',
          url: 'https://example.com/x',
          filePath: null,
          status: 'draft',
          publishedAt: null,
        }),
      ).rejects.toThrow('Failed to create resource');

      await expect(
        service.updateResource('missing', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      await expect(service.deleteResource('missing')).rejects.toBeInstanceOf(
        NotFoundException,
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

  describe('trackResourceConsultation', () => {
    it('Given a published resource, When trackResourceConsultation is called, Then it increments consultation_count and updates last_consulted_at', async () => {
      const trackingSelectQuery = createTrackingSelectQuery({
        data: {
          id: 'res-001',
          consultation_count: 5,
          last_consulted_at: null,
        },
        error: null,
      });
      const trackingUpdateQuery = createTrackingUpdateQuery({
        error: null,
      });

      const mockClient = {
        from: jest
          .fn()
          .mockImplementationOnce(() => trackingSelectQuery)
          .mockImplementationOnce(() => trackingUpdateQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(
        service.trackResourceConsultation('res-001'),
      ).resolves.toBeUndefined();

      expect(trackingUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          consultation_count: 6,
          last_consulted_at: expect.any(String),
        }),
      );
    });

    it('Given an unknown resource, When trackResourceConsultation is called, Then it throws NotFoundException', async () => {
      const trackingSelectQuery = createTrackingSelectQuery({
        data: null,
        error: new Error('Not found'),
      });
      const mockClient = {
        from: jest.fn().mockImplementation(() => trackingSelectQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(
        service.trackResourceConsultation('res-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given an update failure, When trackResourceConsultation is called, Then it throws an explicit tracking error', async () => {
      const trackingSelectQuery = createTrackingSelectQuery({
        data: {
          id: 'res-001',
          consultation_count: 9,
          last_consulted_at: '2026-04-20T10:00:00Z',
        },
        error: null,
      });
      const trackingUpdateQuery = createTrackingUpdateQuery({
        error: new Error('Write failed'),
      });

      const mockClient = {
        from: jest
          .fn()
          .mockImplementationOnce(() => trackingSelectQuery)
          .mockImplementationOnce(() => trackingUpdateQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(
        service.trackResourceConsultation('res-001'),
      ).rejects.toThrow('Failed to track resource consultation');
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

    it('Given null program rows without error, When getResourcesByProgram is called, Then it returns an empty list', async () => {
      const programQuery = createProgramQuery({
        data: null,
        error: null,
      });
      const mockClient = {
        from: jest.fn().mockImplementation(() => programQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(mockClient);

      await expect(service.getResourcesByProgram('prog-001')).resolves.toEqual(
        [],
      );
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

    it('Given cohort query with null data and no error, When getResourcesByProgram is called with cohortId, Then cohort fallback uses an empty list', async () => {
      const datedProgramRow = {
        ...mockResourceRow,
        id: 'res-dated',
        published_at: '2026-05-21T10:00:00Z',
      };
      const nullDateProgramRow = {
        ...mockResourceRow,
        id: 'res-null-date',
        published_at: null,
      };
      const programQuery = createProgramQuery({
        data: [nullDateProgramRow, datedProgramRow],
        error: null,
      });
      const cohortQuery = createCohortQuery({
        data: null,
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

      expect(result.map((resource) => resource.id)).toEqual([
        'res-dated',
        'res-null-date',
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
