import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signal } from '@angular/core';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';
import AdminRessourcesPage from './admin-ressources.page';
import type { ResourceDto } from '@kraak/contracts';

const mockRessources: ResourceDto[] = [
  {
    id: 'res-1',
    title: 'Guide de leadership',
    description: 'Un guide pratique sur le leadership.',
    resourceType: 'document',
    resourceTheme: 'training',
    resourceAudience: 'all',
    url: 'https://example.com/guide',
    filePath: null,
    status: 'published',
    publishedAt: '2025-01-01T00:00:00Z',
    programId: null,
    cohortId: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'res-2',
    title: 'Vidéo : gestion de projet agile',
    description: null,
    resourceType: 'video',
    resourceTheme: 'project_management',
    resourceAudience: 'organizations',
    url: 'https://example.com/video',
    filePath: null,
    status: 'draft',
    publishedAt: null,
    programId: null,
    cohortId: null,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
];

const webAuthServiceMock = {
  currentSession: signal<null>(null),
  isAuthenticated: signal(false),
  isAdmin: signal(false),
  hasRole: () => false,
};

const resourcesClientMock = {
  list: async () => ({ data: mockRessources, total: mockRessources.length }),
  create: async () =>
    ({
      id: 'res-new',
      title: 'New',
      description: null,
      resourceType: 'link',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: null,
      filePath: null,
      status: 'draft',
      publishedAt: null,
      programId: null,
      cohortId: null,
      createdAt: '',
      updatedAt: '',
    }) as ResourceDto,
  update: async (id: string) => ({ ...mockRessources[0], id }),
  remove: async () => undefined,
};

describe('AdminRessourcesPage', () => {
  it('Given des valeurs métier inconnues, When aucune traduction n’existe, Then les libellés bruts restent disponibles', () => {
    const page = TestBed.createComponent(AdminRessourcesPage).componentInstance;
    vi.spyOn(TestBed.inject(KraakI18nService), 'translate').mockImplementation(
      (key) => key,
    );
    expect(page['getPublicationStatusLabel']('inconnu')).toBe('inconnu');
    expect(page['getResourceTypeLabel']('inconnu')).toBe('inconnu');
    expect(page['getResourceThemeLabel']('inconnu')).toBe('inconnu');
    expect(page['getResourceAudienceLabel']('inconnu')).toBe('inconnu');
  });

  it('Given une réponse sous forme de tableau, When les ressources sont chargées, Then le catalogue accepte ce format', async () => {
    const page = TestBed.createComponent(AdminRessourcesPage).componentInstance;
    page.resourcesClient = {
      ...resourcesClientMock,
      list: vi.fn().mockResolvedValue(mockRessources),
    };
    await page.loadRessources();
    expect(page['ressources']()).toEqual(mockRessources);
  });

  it('Given une ressource sans URL ni description, When elle est modifiée, Then les champs vides sont renvoyés sous forme de valeurs nulles', async () => {
    const page = TestBed.createComponent(AdminRessourcesPage).componentInstance;
    const resource = { ...mockRessources[0], url: null, description: null };
    const update = vi.fn().mockResolvedValue(resource);
    page.resourcesClient = { ...resourcesClientMock, update };
    page.openEditForm(resource);
    expect(page.form.controls.url.value).toBe('');
    expect(page.form.controls.description.value).toBe('');
    await page.submitForm();
    expect(update).toHaveBeenCalledWith(
      resource.id,
      expect.objectContaining({ url: null, description: null }),
    );
  });

  it.each([null, {}, { accessToken: 'test-token' }])(
    'Given une session %j, When le client réel charge les ressources, Then le jeton disponible et la langue sont transmis',
    async (session) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          new Response(JSON.stringify(mockRessources), { status: 200 }),
        );
      vi.spyOn(
        TestBed.inject(WebAuthService),
        'currentSession',
      ).mockReturnValue(
        session as ReturnType<WebAuthService['currentSession']>,
      );
      const page =
        TestBed.createComponent(AdminRessourcesPage).componentInstance;
      await page.loadRessources();
      const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
      expect(headers.get('Authorization')).toBe(
        session && 'accessToken' in session ? 'Bearer test-token' : null,
      );
      expect(headers.get('Accept-Language')).toBe(
        TestBed.inject(KraakI18nService).locale(),
      );
      expect(page['ressources']()).toEqual(mockRessources);
    },
  );
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [AdminRessourcesPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        MessageService,
        { provide: WebAuthService, useValue: webAuthServiceMock },
      ],
    }).compileComponents();
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given the admin ressources page When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the admin ressources page When it renders Then it shows the page heading', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Ressources');
    expect(content).toContain('Nouvelle ressource');
    expect(content).toContain('Administration');
  });

  it('Given ressources are loaded When the list is displayed Then it shows the resource titles', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Guide de leadership');
    expect(content).toContain('Vidéo : gestion de projet agile');
  });

  it('Given no ressources exist When the list renders Then it shows the empty state', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      list: async () => ({ data: [], total: 0 }),
    };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Aucune ressource pour le moment');
  });

  it('Given the create button is clicked When the form opens Then it shows the create form', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Nouvelle ressource');
    expect(content).toContain('Titre');
    expect(content).toContain('Type');
    expect(content).toContain('Annuler');
  });

  it('Given an existing ressource When openEditForm is called Then the form is prefilled', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openEditForm(mockRessources[0]);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].controls.title.value).toBe(
      'Guide de leadership',
    );
    expect(fixture.componentInstance['form'].controls.resourceType.value).toBe(
      'document',
    );
  });

  it('Given the form is open When cancelForm is called Then the form is hidden', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    fixture.componentInstance.resourcesClient = resourcesClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    fixture.componentInstance.cancelForm();
    fixture.detectChanges();

    expect(fixture.componentInstance['showForm']()).toBe(false);
  });

  it('Given a valid creation form When submitForm is called Then the resource is created', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    const createSpy = vi.fn(
      async () =>
        ({
          id: 'res-created',
          title: 'Ressource créée',
          description: null,
          resourceType: 'link',
          resourceTheme: 'training',
          resourceAudience: 'all',
          url: null,
          filePath: null,
          status: 'draft',
          publishedAt: null,
          programId: null,
          cohortId: null,
          createdAt: '2025-03-01T00:00:00Z',
          updatedAt: '2025-03-01T00:00:00Z',
        }) as ResourceDto,
    );

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      create: createSpy,
      list: async () => ({ data: [], total: 0 }),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance['form'].setValue({
      title: 'Ressource créée',
      description: '',
      resourceType: 'link',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: '',
      status: 'draft',
    });

    await fixture.componentInstance.submitForm();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance['ressources']()).toHaveLength(1);
    expect(fixture.componentInstance['successMessage']()).toContain('créée');
  });

  it('Given a valid edit form When submitForm is called Then the resource is updated', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    const updateSpy = vi.fn(async (id: string) => ({
      ...mockRessources[0],
      id,
      title: 'Guide mis à jour',
    }));

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      update: updateSpy,
    };

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openEditForm(mockRessources[0]);
    fixture.componentInstance['form'].patchValue({ title: 'Guide mis à jour' });

    await fixture.componentInstance.submitForm();

    expect(updateSpy).toHaveBeenCalledWith(
      mockRessources[0].id,
      expect.objectContaining({ title: 'Guide mis à jour' }),
    );
    expect(fixture.componentInstance['ressources']()[0]?.title).toBe(
      'Guide mis à jour',
    );
    expect(fixture.componentInstance['successMessage']()).toContain(
      'mise à jour',
    );
  });

  it('Given an invalid form When submitForm is called Then no creation request is sent', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    const createSpy = vi.fn(resourcesClientMock.create);

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      create: createSpy,
    };
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance['form'].patchValue({ title: '' });

    await fixture.componentInstance.submitForm();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('Given a save failure When submitForm is called Then an explicit error message is displayed', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      create: vi.fn(async () => {
        throw new Error('save failed');
      }),
      list: async () => ({ data: [], total: 0 }),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance['form'].setValue({
      title: 'Ressource',
      description: '',
      resourceType: 'link',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: '',
      status: 'draft',
    });

    await fixture.componentInstance.submitForm();

    expect(fixture.componentInstance['errorMessage']()).toContain('sauvegarde');
    expect(fixture.componentInstance['submitting']()).toBe(false);
  });

  it('Given a refusal in the confirmation dialog When deleteRessource is called Then nothing is deleted', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    const removeSpy = vi.fn(async () => undefined);
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      remove: removeSpy,
    };

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.deleteRessource(mockRessources[0]);

    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('Given a confirmed deletion When deleteRessource is called Then the resource is removed from state', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      remove: vi.fn(async () => undefined),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.deleteRessource(mockRessources[0]);

    expect(fixture.componentInstance['ressources']()).toHaveLength(1);
    expect(fixture.componentInstance['successMessage']()).toContain(
      'supprimée',
    );
  });

  it('Given a deletion API failure When deleteRessource is called Then an explicit error is shown', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      remove: vi.fn(async () => {
        throw new Error('delete failed');
      }),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.deleteRessource(mockRessources[0]);

    expect(fixture.componentInstance['errorMessage']()).toContain('supprimer');
  });

  it('Given an authenticated admin session When default resources client is used Then the token supplier is consumed', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);
    webAuthServiceMock.currentSession = signal({
      accessToken: 'admin-token',
    } as never);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0 }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await fixture.componentInstance.resourcesClient.list();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('Given a loading failure When the page initializes Then the load error is exposed', async () => {
    const fixture = TestBed.createComponent(AdminRessourcesPage);

    fixture.componentInstance.resourcesClient = {
      ...resourcesClientMock,
      list: vi.fn(async () => {
        throw new Error('network');
      }),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['errorMessage']()).toContain('charger');
    expect(fixture.componentInstance['loading']()).toBe(false);
  });

  it('Given English locale, When the page renders, Then it renders Admin Resources chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(AdminRessourcesPage);
    const comp = fixture.componentInstance;

    comp.loadRessources = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['ressources'].set([]);

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    let content = host.textContent ?? '';

    expect(content).toContain('Resources');
    expect(content).toContain(
      'Manage KRAAK resources: creation, editing, type and publication status.',
    );
    expect(content).toContain('Dashboard');
    expect(content).toContain('New resource');
    expect(content).toContain('No resources yet.');
    expect(content).toContain('Create the first resource');

    comp.openCreateForm();
    fixture.detectChanges();

    content = host.textContent ?? '';

    expect(content).toContain('New resource');
    expect(content).toContain('Title');
    expect(content).toContain('Description');
    expect(content).toContain('Type');
    expect(content).toContain('Theme');
    expect(content).toContain('Audience');
    expect(content).toContain('Status');
    expect(content).toContain('URL');
    expect(content).toContain('Create resource');
    expect(content).toContain('Cancel');

    expect(content).toContain('Link');
    expect(content).toContain('File');
    expect(content).toContain('Video');
    expect(content).toContain('Document');

    expect(content).toContain('Training');
    expect(content).toContain('Project management');
    expect(content).toContain('Immigration');
    expect(content).toContain('Career');

    expect(content).toContain('All');
    expect(content).toContain('Young professionals and students');
    expect(content).toContain('Organizations');
    expect(content).toContain('International candidates');

    expect(content).toContain('Draft');
    expect(content).toContain('Published');
    expect(content).toContain('Archived');

    const titleInput = host.querySelector(
      '#res-title',
    ) as HTMLInputElement | null;

    const descriptionInput = host.querySelector(
      '#res-description',
    ) as HTMLTextAreaElement | null;

    const urlInput = host.querySelector('#res-url') as HTMLInputElement | null;

    expect(titleInput?.placeholder).toBe('Resource title');
    expect(descriptionInput?.placeholder).toBe(
      'Resource description (optional)',
    );
    expect(urlInput?.placeholder).toBe('https://... (optional)');

    expect(comp['getResourceTypeLabel']('video')).toBe('Video');
    expect(comp['getResourceThemeLabel']('project_management')).toBe(
      'Project management',
    );
    expect(comp['getResourceAudienceLabel']('international_candidates')).toBe(
      'International candidates',
    );
    expect(comp['getPublicationStatusLabel']('published')).toBe('Published');
  });
});
