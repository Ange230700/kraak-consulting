import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ResourceDto } from '@kraak/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileResourcesService } from './mobile-resources.service';
import ResourceListPage from './resource-list.page';

describe('Mobile ResourceListPage', () => {
  let service: { listResources: ReturnType<typeof vi.fn> };

  const resources: ResourceDto[] = [
    {
      id: 'resource-1',
      programId: null,
      cohortId: null,
      title: 'Guide de demarrage',
      description: 'Document de preparation a la premiere session.',
      resourceType: 'document',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: 'https://example.com/guide',
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
    expect(element.textContent).toContain('Guide de demarrage');
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

    searchInput.value = 'demarrage';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Guide de demarrage');
    expect(element.textContent).not.toContain('Boite a outils projet');
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
    expect(component.getResourceThemeLabel('unknown_theme' as never)).toBe(
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
    expect(
      component.getResourceAudienceLabel('unknown_audience' as never),
    ).toBe('unknown_audience');
  });
});
