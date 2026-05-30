import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
} from '@kraak/contracts';
import { AuthService } from '../auth/auth.service';
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
    listAllResources: jest.fn(),
    getResourceById: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    deleteResource: jest.fn(),
    trackResourceConsultation: jest.fn(),
  };

  const authService = {
    getSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          useValue: mockResourcesService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);

    authService.getSession.mockResolvedValue({
      profile: {
        appUser: {
          role: 'participant',
        },
      },
    });
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

  it('Given an admin Authorization header, When listResources is called, Then it returns the admin listing', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });
    mockResourcesService.listAllResources.mockResolvedValue(mockListResponse);

    const result = await controller.listResources(
      'training',
      'all',
      'prog-001',
      1,
      10,
      'Bearer access-token',
    );

    expect(mockResourcesService.listAllResources).toHaveBeenCalledWith({
      resourceTheme: 'training',
      resourceAudience: 'all',
      programId: 'prog-001',
      page: 1,
      limit: 10,
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

  it('Given a resource id, When trackResourceConsultation is called, Then it delegates to service and returns no content', async () => {
    const resourceId = 'res-001';
    mockResourcesService.trackResourceConsultation.mockResolvedValue(undefined);

    await expect(
      controller.trackResourceConsultation(resourceId),
    ).resolves.toBeUndefined();

    expect(mockResourcesService.trackResourceConsultation).toHaveBeenCalledWith(
      resourceId,
    );
  });

  it('Given un payload création valide, When createResource is called, Then it delegates to the service', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });
    mockResourcesService.createResource.mockResolvedValue(mockResource);

    const result = await controller.createResource(
      {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript fundamentals',
        resourceType: 'video',
        resourceTheme: 'training',
        resourceAudience: 'all',
        url: 'https://example.com/resource',
        filePath: null,
        status: 'published',
        publishedAt: null,
        programId: null,
        cohortId: null,
      },
      'Bearer access-token',
    );

    expect(mockResourcesService.createResource).toHaveBeenCalledWith({
      title: 'TypeScript Basics',
      description: 'Learn TypeScript fundamentals',
      resourceType: 'video',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: 'https://example.com/resource',
      filePath: null,
      status: 'published',
      publishedAt: null,
      programId: null,
      cohortId: null,
    });
    expect(result).toEqual(mockResource);
  });

  it('Given an invalid Authorization header, When listResources is called, Then an UnauthorizedException is thrown', async () => {
    await expect(
      controller.listResources('training', 'all', 'prog-001', 1, 10, 'Bearer '),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given a non-admin Authorization header, When listResources is called, Then it falls back to public listing', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'participant',
        },
      },
    });
    mockResourcesService.listResources.mockResolvedValueOnce(mockListResponse);

    const result = await controller.listResources(
      'training',
      'all',
      'prog-001',
      1,
      10,
      'Bearer access-token',
    );

    expect(mockResourcesService.listAllResources).not.toHaveBeenCalled();
    expect(mockResourcesService.listResources).toHaveBeenCalledWith({
      resourceTheme: 'training',
      resourceAudience: 'all',
      programId: 'prog-001',
      page: 1,
      limit: 10,
    });
    expect(result).toEqual(mockListResponse);
  });

  it('Given a valid admin token, When updateResource is called, Then it delegates to updateResource service', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });
    mockResourcesService.updateResource.mockResolvedValueOnce(mockResource);

    const result = await controller.updateResource(
      'res-001',
      {
        title: 'TypeScript Basics',
      },
      'Bearer access-token',
    );

    expect(mockResourcesService.updateResource).toHaveBeenCalledWith(
      'res-001',
      {
        title: 'TypeScript Basics',
      },
    );
    expect(result).toEqual(mockResource);
  });

  it('Given a valid admin token, When patchResource is called, Then it reuses updateResource logic', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });
    mockResourcesService.updateResource.mockResolvedValueOnce(mockResource);

    await controller.patchResource(
      'res-001',
      {
        description: 'Updated description',
      },
      'Bearer access-token',
    );

    expect(mockResourcesService.updateResource).toHaveBeenCalledWith(
      'res-001',
      {
        description: 'Updated description',
      },
    );
  });

  it('Given an invalid create payload, When createResource is called, Then a BadRequestException is thrown', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });

    await expect(
      controller.createResource(
        {
          title: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given an invalid update payload, When updateResource is called, Then a BadRequestException is thrown', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });

    await expect(
      controller.updateResource(
        'res-001',
        {
          title: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given a participant token, When createResource is called, Then a ForbiddenException is thrown', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'participant',
        },
      },
    });

    await expect(
      controller.createResource(
        {
          title: 'TypeScript Basics',
          resourceType: 'video',
          resourceTheme: 'training',
          resourceAudience: 'all',
          status: 'published',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given a valid admin token, When deleteResource is called, Then it delegates to deleteResource service', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });

    await expect(
      controller.deleteResource('res-001', 'Bearer access-token'),
    ).resolves.toBeUndefined();

    expect(mockResourcesService.deleteResource).toHaveBeenCalledWith('res-001');
  });

  it('Given no Authorization header, When deleteResource is called, Then an UnauthorizedException is thrown', async () => {
    await expect(controller.deleteResource('res-001')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
