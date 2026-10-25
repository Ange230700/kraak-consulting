import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationInitStatus, signal } from '@angular/core';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';
import AdminProgrammesPage from './admin-programmes.page';
import type { ProgramDto } from '@kraak/contracts';

const mockProgrammes: ProgramDto[] = [
  {
    id: 'prog-1',
    slug: 'formation-leadership',
    title: 'Formation Leadership',
    summary: 'Un programme de formation au leadership.',
    description: 'Description complète du programme de formation.',
    status: 'published',
    visibility: 'public',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'prog-2',
    slug: 'gestion-projet',
    title: 'Gestion de Projet',
    summary: 'Maîtriser les fondamentaux de la gestion de projet.',
    description: 'Description complète du programme de gestion de projet.',
    status: 'draft',
    visibility: 'private',
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

const programsClientMock = {
  list: async () => mockProgrammes,
  create: async () =>
    ({
      id: 'prog-new',
      slug: 'new',
      title: 'New',
      summary: '',
      description: '',
      status: 'draft',
      visibility: 'private',
      createdAt: '',
      updatedAt: '',
    }) as ProgramDto,
  update: async (id: string) => ({ ...mockProgrammes[0], id }),
  remove: async () => undefined,
};

describe('AdminProgrammesPage', () => {
  it('Given des valeurs métier inconnues, When aucune traduction n’existe, Then les libellés bruts restent disponibles', () => {
    const page = TestBed.createComponent(AdminProgrammesPage).componentInstance;
    vi.spyOn(TestBed.inject(KraakI18nService), 'translate').mockImplementation(
      (key) => key,
    );
    expect(page['getPublicationStatusLabel']('inconnu')).toBe('inconnu');
    expect(page['getProgramVisibilityLabel']('inconnue')).toBe('inconnue');
  });

  it.each([null, {}, { accessToken: 'test-token' }])(
    'Given une session %j, When le client réel charge les programmes, Then le jeton disponible et la langue sont transmis',
    async (session) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          new Response(JSON.stringify(mockProgrammes), { status: 200 }),
        );
      vi.spyOn(
        TestBed.inject(WebAuthService),
        'currentSession',
      ).mockReturnValue(
        session as ReturnType<WebAuthService['currentSession']>,
      );
      const page =
        TestBed.createComponent(AdminProgrammesPage).componentInstance;
      await page.loadProgrammes();
      const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
      expect(headers.get('Authorization')).toBe(
        session && 'accessToken' in session ? 'Bearer test-token' : null,
      );
      expect(headers.get('Accept-Language')).toBe(
        TestBed.inject(KraakI18nService).locale(),
      );
      expect(page['programmes']()).toEqual(mockProgrammes);
    },
  );
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [AdminProgrammesPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        MessageService,
        { provide: WebAuthService, useValue: webAuthServiceMock },
      ],
    }).compileComponents();
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given the admin programmes page When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the admin programmes page When it renders Then it shows the page heading', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Programmes');
    expect(content).toContain('Nouveau programme');
    expect(content).toContain('Administration');
  });

  it('Given programmes are loaded When the list is displayed Then it shows the programme titles', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Formation Leadership');
    expect(content).toContain('Gestion de Projet');
  });

  it('Given no programmes exist When the list renders Then it shows the empty state', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      list: async () => [],
    };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Aucun programme pour le moment');
  });

  it('Given the create button is clicked When the form opens Then it shows the create form', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Nouveau programme');
    expect(content).toContain('Slug');
    expect(content).toContain('Titre');
    expect(content).toContain('Annuler');
  });

  it('Given an existing programme When openEditForm is called Then the form is prefilled', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openEditForm(mockProgrammes[0]);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].controls.title.value).toBe(
      'Formation Leadership',
    );
    expect(fixture.componentInstance['form'].controls.slug.value).toBe(
      'formation-leadership',
    );
  });

  it('Given the form is open When cancelForm is called Then the form is hidden', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    fixture.componentInstance.programsClient = programsClientMock;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();

    fixture.componentInstance.cancelForm();
    fixture.detectChanges();

    expect(fixture.componentInstance['showForm']()).toBe(false);
  });

  it('Given a valid creation form When submitForm is called Then a program is created and success feedback is shown', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    const createSpy = vi.fn(
      async () =>
        ({
          id: 'prog-created',
          slug: 'leadership-niveau-2',
          title: 'Leadership Niveau 2',
          summary: 'Résumé',
          description: 'Description',
          status: 'draft',
          visibility: 'private',
          createdAt: '2025-03-01T00:00:00Z',
          updatedAt: '2025-03-01T00:00:00Z',
        }) as ProgramDto,
    );

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      create: createSpy,
      list: async () => [],
    };

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance['form'].setValue({
      slug: 'leadership-niveau-2',
      title: 'Leadership Niveau 2',
      summary: 'Résumé',
      description: 'Description',
      status: 'draft',
      visibility: 'private',
    });

    await fixture.componentInstance.submitForm();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance['programmes']()).toHaveLength(1);
    expect(fixture.componentInstance['successMessage']()).toContain('créé');
    expect(fixture.componentInstance['showForm']()).toBe(false);
  });

  it('Given a valid edit form When submitForm is called Then the program is updated', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    const updateSpy = vi.fn(async (id: string) => ({
      ...mockProgrammes[0],
      id,
      title: 'Titre modifié',
    }));

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      update: updateSpy,
    };

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openEditForm(mockProgrammes[0]);
    fixture.componentInstance['form'].patchValue({ title: 'Titre modifié' });

    await fixture.componentInstance.submitForm();

    expect(updateSpy).toHaveBeenCalledWith(
      mockProgrammes[0].id,
      expect.objectContaining({ title: 'Titre modifié' }),
    );
    expect(fixture.componentInstance['programmes']()[0]?.title).toBe(
      'Titre modifié',
    );
    expect(fixture.componentInstance['successMessage']()).toContain(
      'mis à jour',
    );
  });

  it('Given an invalid form When submitForm is called Then no API call is performed', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    const createSpy = vi.fn(programsClientMock.create);

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      create: createSpy,
    };
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance['form'].patchValue({
      slug: '',
      title: '',
    });

    await fixture.componentInstance.submitForm();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('Given a save error When submitForm is called Then an explicit error message is shown', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      create: vi.fn(async () => {
        throw new Error('save failed');
      }),
      list: async () => [],
    };

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance['form'].setValue({
      slug: 'slug-valide',
      title: 'Titre',
      summary: 'Résumé',
      description: 'Description',
      status: 'draft',
      visibility: 'private',
    });

    await fixture.componentInstance.submitForm();

    expect(fixture.componentInstance['errorMessage']()).toContain('sauvegarde');
    expect(fixture.componentInstance['submitting']()).toBe(false);
  });

  it('Given a deletion confirmation refusal When deleteProgramme is called Then no deletion occurs', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    const removeSpy = vi.fn(async () => undefined);
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      remove: removeSpy,
    };
    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.deleteProgramme(mockProgrammes[0]);

    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('Given a deletion confirmation acceptance When deleteProgramme is called Then the item is removed', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      remove: vi.fn(async () => undefined),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.deleteProgramme(mockProgrammes[0]);

    expect(fixture.componentInstance['programmes']()).toHaveLength(1);
    expect(fixture.componentInstance['successMessage']()).toContain('supprimé');
  });

  it('Given a deletion API failure When deleteProgramme is called Then an explicit error is shown', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      remove: vi.fn(async () => {
        throw new Error('delete failed');
      }),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.deleteProgramme(mockProgrammes[0]);

    expect(fixture.componentInstance['errorMessage']()).toContain('supprimer');
  });

  it('Given an authenticated admin session When default programmes client is used Then the token supplier is consumed', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);
    webAuthServiceMock.currentSession = signal({
      accessToken: 'admin-token',
    } as never);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    await fixture.componentInstance.programsClient.list();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('Given an API load failure When the page initializes Then an explicit loading error is shown', async () => {
    const fixture = TestBed.createComponent(AdminProgrammesPage);

    fixture.componentInstance.programsClient = {
      ...programsClientMock,
      list: vi.fn(async () => {
        throw new Error('network');
      }),
    };

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['errorMessage']()).toContain('charger');
    expect(fixture.componentInstance['loading']()).toBe(false);
  });

  it('Given English locale, When the page renders, Then it renders Admin Programmes chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(AdminProgrammesPage);
    const comp = fixture.componentInstance;

    comp.programsClient = programsClientMock;
    comp.loadProgrammes = vi.fn().mockResolvedValue(undefined);

    comp['loading'].set(false);
    comp['programmes'].set(mockProgrammes);

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const content = host.textContent ?? '';

    expect(content).toContain('Programmes');
    expect(content).toContain(
      'Manage KRAAK programmes: creation, editing and publication status.',
    );
    expect(content).toContain('Dashboard');
    expect(content).toContain('New programme');

    expect(content).toContain('Title');
    expect(content).toContain('Slug');
    expect(content).toContain('Status');
    expect(content).toContain('Visibility');
    expect(content).toContain('Actions');

    expect(content).toContain('Published');
    expect(content).toContain('Public');
    expect(content).toContain('Draft');
    expect(content).toContain('Private');

    expect(content).toContain('Edit');
    expect(content).toContain('Delete');

    expect(comp['getPublicationStatusLabel']('published')).toBe('Published');
    expect(comp['getPublicationStatusLabel']('draft')).toBe('Draft');
    expect(comp['getProgramVisibilityLabel']('public')).toBe('Public');
    expect(comp['getProgramVisibilityLabel']('private')).toBe('Private');

    expect(comp['getEditAriaLabel'](mockProgrammes[0])).toBe(
      'Edit programme Formation Leadership',
    );

    expect(comp['getDeleteAriaLabel'](mockProgrammes[0])).toBe(
      'Delete programme Formation Leadership',
    );

    comp.openCreateForm();
    fixture.detectChanges();

    const formContent = host.textContent ?? '';

    expect(formContent).toContain('Create programme');
    expect(formContent).toContain('Summary');
    expect(formContent).toContain('Description');
    expect(formContent).toContain('Cancel');

    const slugInput = host.querySelector(
      '#prog-slug',
    ) as HTMLInputElement | null;

    const titleInput = host.querySelector(
      '#prog-title',
    ) as HTMLInputElement | null;

    const summaryInput = host.querySelector(
      '#prog-summary',
    ) as HTMLTextAreaElement | null;

    const descriptionInput = host.querySelector(
      '#prog-description',
    ) as HTMLTextAreaElement | null;

    expect(slugInput?.placeholder).toBe('e.g. leadership-training');
    expect(titleInput?.placeholder).toBe('Programme title');
    expect(summaryInput?.placeholder).toBe('Short summary shown in the list');
    expect(descriptionInput?.placeholder).toBe('Full programme description');
  });
});
