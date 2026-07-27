import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { AnnouncementDto } from '@kraak/contracts';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobileAuthService } from '../auth/mobile-auth.service';
import AnnouncementListPage from './announcement-list.page';

function configureAnnouncementsClient(
  fixture: ReturnType<typeof TestBed.createComponent<AnnouncementListPage>>,
  response: Promise<unknown>,
): void {
  const component = fixture.componentInstance as unknown as {
    announcementsClient: { list: () => Promise<unknown> };
  };

  component.announcementsClient = {
    list: vi.fn().mockImplementation(() => response),
  };
}

describe('Mobile AnnouncementListPage', () => {
  const mobileAuthServiceMock = {
    currentSession: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    mobileAuthServiceMock.currentSession.mockReset();
    mobileAuthServiceMock.currentSession.mockReturnValue({
      accessToken: 'token-mobile-list',
    });

    await TestBed.configureTestingModule({
      imports: [AnnouncementListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileAuthService, useValue: mobileAuthServiceMock },
      ],
    }).compileComponents();
  });

  it('Given a valid mobile session, when announcements are loaded through the real API client, then Authorization header uses the current session token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('[]'),
    });
    vi.stubGlobal('fetch', fetchMock);

    const fixture = TestBed.createComponent(AnnouncementListPage);
    await fixture.componentInstance['reloadAnnouncements']();

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(init.headers['Authorization']).toBe('Bearer token-mobile-list');
  });

  it('Given no mobile session, when announcements are loaded through the real API client, then Authorization header is omitted', async () => {
    mobileAuthServiceMock.currentSession.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve([]),
      text: () => Promise.resolve('[]'),
    });
    vi.stubGlobal('fetch', fetchMock);

    const fixture = TestBed.createComponent(AnnouncementListPage);
    await fixture.componentInstance['reloadAnnouncements']();

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(init.headers['Authorization']).toBeUndefined();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    configureAnnouncementsClient(
      fixture,
      Promise.resolve({ data: [], total: 0 }),
    );

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given API announcements, when page loads, then it renders the feed and entry point to detail', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    const announcements: AnnouncementDto[] = [
      {
        id: 'ann-001',
        title: 'Mise a jour importante',
        body: 'Nouvelle information utile pour tous les participants.',
        priority: 'high',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    configureAnnouncementsClient(
      fixture,
      Promise.resolve({ data: announcements, total: announcements.length }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const title = fixture.nativeElement.querySelector('ion-title');

    expect(title?.textContent).toContain('Annonces');
    expect(element.textContent).toContain('Mise a jour importante');
    expect(element.textContent).toContain(
      'Nouvelle information utile pour tous les participants.',
    );

    expect(element.textContent).toContain('Lire le d\u00E9tail');
  });

  it('Given an API error, when page loads, then it shows an actionable error state', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    configureAnnouncementsClient(
      fixture,
      Promise.reject(new Error('Erreur annonces test')),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Erreur annonces test');
    expect(element.textContent).toContain('Recharger le flux');
  });

  it('Given a loaded page, when reloadAnnouncements is called, then the API is called again', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    const listMock = vi.fn().mockResolvedValue({ data: [], total: 0 });
    const component = fixture.componentInstance as unknown as {
      announcementsClient: { list: () => Promise<unknown> };
      reloadAnnouncements: () => Promise<void>;
    };
    component.announcementsClient = { list: listMock };

    fixture.detectChanges();
    await fixture.whenStable();

    await component.reloadAnnouncements();

    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it('Given the API returns a plain array, when page loads, then announcements are displayed', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    const announcements: AnnouncementDto[] = [
      {
        id: 'ann-002',
        title: 'Array response',
        body: 'Contenu de test.',
        priority: 'normal',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    configureAnnouncementsClient(fixture, Promise.resolve(announcements));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Array response');
  });

  it('Given the API returns an unknown shape, when page loads, then empty list is shown without error', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    configureAnnouncementsClient(fixture, Promise.resolve(null));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      announcements: () => AnnouncementDto[];
      total: () => number;
    };
    expect(component.announcements()).toEqual([]);
    expect(component.total()).toBe(0);
  });

  it.each([
    ['critical' as const, 'Critique'],
    ['normal' as const, 'Normale'],
    ['low' as const, 'Faible'],
  ])(
    'Given a component instance, when getPriorityLabel is called with %s, then it returns %s',
    (priority, expectedLabel) => {
      const fixture = TestBed.createComponent(AnnouncementListPage);
      configureAnnouncementsClient(
        fixture,
        Promise.resolve({ data: [], total: 0 }),
      );
      fixture.detectChanges();

      const component = fixture.componentInstance as unknown as {
        getPriorityLabel: (p: AnnouncementDto['priority']) => string;
      };
      expect(component.getPriorityLabel(priority)).toBe(expectedLabel);
    },
  );

  it('Given API returns object without total, when page loads, then total falls back to data.length', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    const announcements: AnnouncementDto[] = [
      {
        id: 'ann-003',
        title: 'No total field',
        body: 'Test.',
        priority: 'low',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    configureAnnouncementsClient(
      fixture,
      Promise.resolve({ data: announcements }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      total: () => number;
    };
    expect(component.total()).toBe(1);
  });

  it('Given an announcement without publishedAt, when page loads, then publish date badge is not displayed', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    const announcements: AnnouncementDto[] = [
      {
        id: 'ann-no-date',
        title: 'Annonce sans date',
        body: 'Contenu sans date de publication.',
        priority: 'normal',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'draft',
        publishedAt: null,
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    configureAnnouncementsClient(
      fixture,
      Promise.resolve({ data: announcements, total: 1 }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Annonce sans date');
    expect(element.textContent).not.toContain('Publié le');
  });

  it('Given two concurrent loads, when the older success resolves after the newer one, then stale success is ignored', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    let resolveOlderLoad!: (value: unknown) => void;

    const olderLoad = new Promise<unknown>((resolve) => {
      resolveOlderLoad = resolve;
    });

    const newerAnnouncements: AnnouncementDto[] = [
      {
        id: 'ann-newer',
        title: 'Annonce la plus récente',
        body: 'Contenu récent.',
        priority: 'normal',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    const staleAnnouncements: AnnouncementDto[] = [
      {
        id: 'ann-stale',
        title: 'Annonce obsolète',
        body: 'Contenu obsolète.',
        priority: 'low',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-28T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-28T09:30:00.000Z',
        updatedAt: '2026-04-28T09:45:00.000Z',
      },
    ];

    const listMock = vi
      .fn()
      .mockReturnValueOnce(olderLoad)
      .mockResolvedValueOnce({ data: newerAnnouncements, total: 1 });

    const component = fixture.componentInstance as unknown as {
      announcementsClient: { list: () => Promise<unknown> };
      reloadAnnouncements: () => Promise<void>;
      announcements: () => AnnouncementDto[];
      total: () => number;
      errorMessage: () => string | null;
      loading: () => boolean;
    };
    component.announcementsClient = { list: listMock };

    const olderRun = component.reloadAnnouncements();
    const newerRun = component.reloadAnnouncements();

    await newerRun;
    resolveOlderLoad({ data: staleAnnouncements, total: 1 });
    await olderRun;

    expect(component.announcements()).toEqual(newerAnnouncements);
    expect(component.total()).toBe(1);
    expect(component.errorMessage()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  it('Given two concurrent loads, when the older one fails after the newer success, then stale error state is ignored', async () => {
    const fixture = TestBed.createComponent(AnnouncementListPage);
    let rejectOlderLoad!: (reason?: unknown) => void;

    const olderLoad = new Promise<unknown>((_, reject) => {
      rejectOlderLoad = reject;
    });

    const newerAnnouncements: AnnouncementDto[] = [
      {
        id: 'ann-stable',
        title: 'Annonce stable',
        body: 'Contenu stable.',
        priority: 'high',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T11:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      },
    ];

    const listMock = vi
      .fn()
      .mockReturnValueOnce(olderLoad)
      .mockResolvedValueOnce({ data: newerAnnouncements, total: 1 });

    const component = fixture.componentInstance as unknown as {
      announcementsClient: { list: () => Promise<unknown> };
      reloadAnnouncements: () => Promise<void>;
      announcements: () => AnnouncementDto[];
      total: () => number;
      errorMessage: () => string | null;
      loading: () => boolean;
    };
    component.announcementsClient = { list: listMock };

    const olderRun = component.reloadAnnouncements();
    const newerRun = component.reloadAnnouncements();

    await newerRun;
    rejectOlderLoad(new Error('stale failure'));
    await olderRun;

    expect(component.announcements()).toEqual(newerAnnouncements);
    expect(component.total()).toBe(1);
    expect(component.errorMessage()).toBeNull();
    expect(component.loading()).toBe(false);
  });
});
