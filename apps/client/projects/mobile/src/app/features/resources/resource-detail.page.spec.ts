import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import type { ResourceDto } from '@kraak/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileResourcesService } from './mobile-resources.service';
import ResourceDetailPage from './resource-detail.page';

describe('Mobile ResourceDetailPage', () => {
  let service: { getResourceById: ReturnType<typeof vi.fn> };

  const mockResource: ResourceDto = {
    id: 'resource-1',
    programId: null,
    cohortId: null,
    title: 'Guide detail',
    description: 'Description detail',
    resourceType: 'document',
    resourceTheme: 'training',
    resourceAudience: 'all',
    url: 'https://example.com/guide',
    filePath: null,
    status: 'published',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    service = {
      getResourceById: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceDetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        {
          provide: MobileResourcesService,
          useValue: service,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ resourceId: 'resource-1' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    service.getResourceById.mockResolvedValue(mockResource);
    const fixture = TestBed.createComponent(ResourceDetailPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given a valid resource id, when detail loads, then resource data is rendered', async () => {
    service.getResourceById.mockResolvedValue(mockResource);
    const fixture = TestBed.createComponent(ResourceDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Guide detail');
    expect(element.textContent).toContain('Description detail');
  });

  it('Given an API failure, when detail loads, then an error message is shown', async () => {
    service.getResourceById.mockRejectedValue(new Error('Erreur detail test'));
    const fixture = TestBed.createComponent(ResourceDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Erreur detail test');
  });
});
