import { Test, TestingModule } from '@nestjs/testing';
import type {
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
} from '@kraak/contracts';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

describe('ResourcesController', () => {
  let controller: ResourcesController;

  const mockListResponse = {
    data: [
      {
        id: 'res-001',
        programId: 'prog-001',
        cohortId: null,
        title: 'TypeScript Basics',
        description: 'Learn TypeScript fundamentals',
        resourceType: 'video',
        resourceTheme: 'training',
        resourceAudience: 'all',
        url: 'https://example.com/resource',
        filePath: null,
        status: 'published',
        publishedAt: '2026-04-20T10:00:00Z',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-20T10:00:00Z',
      } satisfies ResourceDto,
    ],
    total: 1,
  };

  const mockResource = mockListResponse.data[0];

  const mockResourcesService = {
    listResources: jest.fn(),
    getResourceById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          useValue: mockResourcesService,
        },
      ],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Given filters and pagination, When listResources is called, Then it delegates to service and returns paginated resources', async () => {
    const resourceTheme: ResourceThemeValue = 'training';
    const resourceAudience: ResourceAudienceValue = 'all';
    const programId = 'prog-001';
    const page = 2;
    const limit = 10;

    mockResourcesService.listResources.mockResolvedValue(mockListResponse);

    const result = await controller.listResources(
      resourceTheme,
      resourceAudience,
      programId,
      page,
      limit,
    );

    expect(mockResourcesService.listResources).toHaveBeenCalledWith({
      resourceTheme,
      resourceAudience,
      programId,
      page,
      limit,
    });
    expect(result).toEqual(mockListResponse);
  });

  it('Given a resource id, When getResourceById is called, Then it delegates to service and returns the resource', async () => {
    const resourceId = 'res-001';
    mockResourcesService.getResourceById.mockResolvedValue(mockResource);

    const result = await controller.getResourceById(resourceId);

    expect(mockResourcesService.getResourceById).toHaveBeenCalledWith(
      resourceId,
    );
    expect(result).toEqual(mockResource);
  });
});
