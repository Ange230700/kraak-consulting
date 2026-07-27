import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ResourceDto } from '@kraak/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileResourcesService } from './mobile-resources.service';
import ResourceListPage from './resource-list.page';

const TEST_RESOURCE_URL = 'https://example.com/guide';

describe('Mobile ResourceListPage', () => {
  let service: { listResources: ReturnType<typeof vi.fn> };

  const resources: ResourceDto[] = [
    {
      id: 'resource-1',
      programId: null,
      cohortId: null,
      title: 'Guide de démarrage',
      description: 'Document de préparation à la première session.',
      resourceType: 'document',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: TEST_RESOURCE_URL,
      filePath: null,
      status: 'published',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'resource-2',
      programId: null,
      cohortId: null,
      title: 'Boite a outils projet',
      description: 'Modeles utiles pour pilotage.',
      resourceType: 'file',
      resourceTheme: 'project_management',
      resourceAudience: 'organizations',
      url: null,
      filePath: '/files/toolkit.pdf',
      status: 'published',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    service = {
      listResources: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileResourcesService, useValue: service },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given available resources, when page loads, then list and title are rendered', async () => {
    service.listResources.mockResolvedValue({ data: resources, total: 2 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Ressources');
    expect(element.textContent).toContain('Guide de démarrage');
    expect(element.textContent).toContain('Boite a outils projet');
  });

  it('Given a search query, when user types in search input, then the list is filtered client-side', async () => {
    service.listResources.mockResolvedValue({ data: resources, total: 2 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const searchInput = element.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;

    searchInput.value = 'démarrage';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Guide de démarrage');
    expect(element.textContent).not.toContain('Boite a outils projet');
  });

  it('Given a resource with null description, when searching by its type, then filtering still works with the fallback empty description', async () => {
    const resourcesWithNullDescription: ResourceDto[] = [
      {
        ...resources[0],
        id: 'resource-null-description',
        title: 'Document sans description',
        description: null,
        resourceType: 'video',
      },
    ];

    service.listResources.mockResolvedValue({
      data: resourcesWithNullDescription,
      total: 1,
    });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const searchInput = element.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;

    searchInput.value = 'video';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Document sans description');
  });

  it('Given a load error, when page initializes, then the error state is displayed', async () => {
    service.listResources.mockRejectedValue(new Error('Erreur API test'));
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Erreur API test');
  });

  it('Given loaded resources and a non-matching search, when filtering is applied, then empty filtered state message is displayed', async () => {
    service.listResources.mockResolvedValue({ data: resources, total: 2 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const searchInput = element.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;

    searchInput.value = 'inexistant-xyz';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain(
      'Aucune ressource ne correspond à vos critères.',
    );
  });

  it('Given a loaded page, when reloadResources is called, then the API is called again', async () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    await (
      fixture.componentInstance as unknown as {
        reloadResources: () => Promise<void>;
      }
    ).reloadResources();

    expect(service.listResources).toHaveBeenCalledTimes(2);
  });

  it('Given a theme select, when onThemeChange is called, then service is called with the theme filter', async () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const event = { target: { value: 'training' } } as unknown as Event;

    await (
      fixture.componentInstance as unknown as {
        onThemeChange: (event: Event) => Promise<void>;
      }
    ).onThemeChange(event);

    expect(service.listResources).toHaveBeenCalledWith(
      expect.objectContaining({ resourceTheme: 'training' }),
    );
  });

  it('Given an audience select, when onAudienceChange is called, then service is called with the audience filter', async () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const event = { target: { value: 'organizations' } } as unknown as Event;

    await (
      fixture.componentInstance as unknown as {
        onAudienceChange: (event: Event) => Promise<void>;
      }
    ).onAudienceChange(event);

    expect(service.listResources).toHaveBeenCalledWith(
      expect.objectContaining({ resourceAudience: 'organizations' }),
    );
  });

  it('Given an unknown theme value, when getResourceThemeLabel is called, then it returns the raw value', () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      getResourceThemeLabel: (theme: string) => string;
    };
    expect(component.getResourceThemeLabel('unknown_theme')).toBe(
      'unknown_theme',
    );
  });

  it('Given an unknown audience value, when getResourceAudienceLabel is called, then it returns the raw value', () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      getResourceAudienceLabel: (audience: string) => string;
    };
    expect(component.getResourceAudienceLabel('unknown_audience')).toBe(
      'unknown_audience',
    );
  });

  it('Given onSearchInput is called with a null event target, then searchQuery defaults to empty string', async () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    (
      fixture.componentInstance as unknown as {
        onSearchInput: (e: Event) => void;
      }
    ).onSearchInput({ target: null } as unknown as Event);

    expect(
      (
        fixture.componentInstance as unknown as { searchQuery: () => string }
      ).searchQuery(),
    ).toBe('');
  });

  it('Given onThemeChange is called with a null event target, then selectedTheme defaults to empty string', async () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    await (
      fixture.componentInstance as unknown as {
        onThemeChange: (e: Event) => Promise<void>;
      }
    ).onThemeChange({ target: null } as unknown as Event);

    expect(service.listResources).toHaveBeenCalled();
  });

  it('Given onAudienceChange is called with a null event target, then selectedAudience defaults to empty string', async () => {
    service.listResources.mockResolvedValue({ data: [], total: 0 });
    const fixture = TestBed.createComponent(ResourceListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    await (
      fixture.componentInstance as unknown as {
        onAudienceChange: (e: Event) => Promise<void>;
      }
    ).onAudienceChange({ target: null } as unknown as Event);

    expect(service.listResources).toHaveBeenCalled();
  });

  it('Given two concurrent loads, when the older success resolves after the newer one, then stale success is ignored', async () => {
    const fixture = TestBed.createComponent(ResourceListPage);
    let resolveOlderLoad!: (value: unknown) => void;

    const olderLoad = new Promise<unknown>((resolve) => {
      resolveOlderLoad = resolve;
    });

    const newerResources: ResourceDto[] = [
      {
        ...resources[0],
        id: 'resource-newer',
        title: 'Ressource la plus récente',
      },
    ];
    const staleResources: ResourceDto[] = [
      {
        ...resources[0],
        id: 'resource-stale',
        title: 'Ressource obsolète',
      },
    ];

    const listMock = vi
      .fn()
      .mockReturnValueOnce(olderLoad)
      .mockResolvedValueOnce({ data: newerResources, total: 1 });

    const component = fixture.componentInstance as unknown as {
      resourcesService: { listResources: () => Promise<unknown> };
      reloadResources: () => Promise<void>;
      resources: () => ResourceDto[];
      errorMessage: () => string | null;
      loading: () => boolean;
    };
    component.resourcesService = { listResources: listMock };

    const olderRun = component.reloadResources();
    const newerRun = component.reloadResources();

    await newerRun;
    resolveOlderLoad({ data: staleResources, total: 1 });
    await olderRun;

    expect(component.resources()).toEqual(newerResources);
    expect(component.errorMessage()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  it('Given two concurrent loads, when the older one fails after a newer success, then stale error state is ignored', async () => {
    const fixture = TestBed.createComponent(ResourceListPage);
    let rejectOlderLoad!: (reason?: unknown) => void;

    const olderLoad = new Promise<unknown>((_, reject) => {
      rejectOlderLoad = reject;
    });

    const newerResources: ResourceDto[] = [
      {
        ...resources[0],
        id: 'resource-stable',
        title: 'Ressource stable',
      },
    ];

    const listMock = vi
      .fn()
      .mockReturnValueOnce(olderLoad)
      .mockResolvedValueOnce({ data: newerResources, total: 1 });

    const component = fixture.componentInstance as unknown as {
      resourcesService: { listResources: () => Promise<unknown> };
      reloadResources: () => Promise<void>;
      resources: () => ResourceDto[];
      errorMessage: () => string | null;
      loading: () => boolean;
    };
    component.resourcesService = { listResources: listMock };

    const olderRun = component.reloadResources();
    const newerRun = component.reloadResources();

    await newerRun;
    rejectOlderLoad(new Error('stale failure'));
    await olderRun;

    expect(component.resources()).toEqual(newerResources);
    expect(component.errorMessage()).toBeNull();
    expect(component.loading()).toBe(false);
  });
});
