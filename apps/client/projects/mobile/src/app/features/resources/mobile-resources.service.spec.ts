import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceDto } from '@kraak/contracts';
import { MobileAuthService } from '../auth/mobile-auth.service';
import { MobileResourcesService } from './mobile-resources.service';

const TEST_RESOURCE_URL = 'https://example.com/guide';

describe('MobileResourcesService', () => {
  let service: MobileResourcesService;
  let authService: { currentSession: () => { accessToken: string } | null };

  const mockResource: ResourceDto = {
    id: 'resource-1',
    programId: null,
    cohortId: null,
    title: 'Guide de démarrage',
    description: 'Description test',
    resourceType: 'document',
    resourceTheme: 'training',
    resourceAudience: 'all',
    url: TEST_RESOURCE_URL,
    filePath: null,
    status: 'published',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    authService = {
      currentSession: vi.fn(() => ({ accessToken: 'test-token' })),
    };

    TestBed.configureTestingModule({
      providers: [
        MobileResourcesService,
        { provide: MobileAuthService, useValue: authService },
      ],
    });

    service = TestBed.inject(MobileResourcesService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given filters, when listResources is called, then it should send resourceTheme and resourceAudience query params', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [mockResource],
          total: 1,
        }),
        { status: 200 },
      ),
    );

    const result = await service.listResources({
      resourceTheme: 'training',
      resourceAudience: 'all',
      page: 2,
      limit: 25,
    });

    expect(result.total).toBe(1);
    expect(result.data[0]?.id).toBe('resource-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/resources?resourceTheme=training&resourceAudience=all&page=2&limit=25',
      ),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('Given a valid id, when getResourceById is called, then it should return the resource detail', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResource), {
        status: 200,
      }),
    );

    const result = await service.getResourceById('resource-1');

    expect(result.id).toBe('resource-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/resources/resource-1'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('Given an API error payload, when listResources fails, then it should throw backend message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Erreur test backend' }), {
        status: 500,
      }),
    );

    await expect(service.listResources()).rejects.toThrow(
      'Erreur test backend',
    );
  });

  it('Given a valid id, when trackResourceConsultation is called, then it should post to consultation endpoint', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, {
        status: 204,
      }),
    );

    await expect(
      service.trackResourceConsultation('resource-1'),
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/resources/resource-1/consultations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });
});
