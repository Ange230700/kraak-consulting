import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import type { AnnouncementDto } from '@kraak/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementDetailPage from './announcement-detail.page';

function configureAnnouncementsClient(
  fixture: ReturnType<typeof TestBed.createComponent<AnnouncementDetailPage>>,
  response: Promise<unknown>,
): void {
  const component = fixture.componentInstance as unknown as {
    announcementsClient: { getById: (id: string) => Promise<unknown> };
  };

  component.announcementsClient = {
    getById: vi.fn().mockImplementation(() => response),
  };
}

describe('Mobile AnnouncementDetailPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    await TestBed.configureTestingModule({
      imports: [AnnouncementDetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ announcementId: 'ann-001' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    configureAnnouncementsClient(
      fixture,
      Promise.resolve({
        id: 'ann-001',
      } satisfies Pick<AnnouncementDto, 'id'>),
    );

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given an announcement id, when detail loads, then it renders announcement content', async () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    const announcement: AnnouncementDto = {
      id: 'ann-001',
      title: 'Session de suivi',
      body: 'La session de suivi est deplacee au jeudi.',
      priority: 'critical',
      audienceType: 'all_participants',
      programId: null,
      cohortId: null,
      status: 'published',
      publishedAt: '2026-04-29T08:00:00.000Z',
      createdByUserId: 'user-2',
      createdAt: '2026-04-28T10:00:00.000Z',
      updatedAt: '2026-04-29T08:10:00.000Z',
    };

    configureAnnouncementsClient(fixture, Promise.resolve(announcement));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const title = fixture.nativeElement.querySelector('ion-title');

    expect(title?.textContent).toContain('Session de suivi');
    expect(element.textContent).toContain(
      'La session de suivi est deplacee au jeudi.',
    );
    expect(element.textContent).toContain('Critique');
  });

  it('Given a detail load error, when detail initializes, then it shows retry action', async () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    configureAnnouncementsClient(
      fixture,
      Promise.reject(new Error('Erreur detail annonce test')),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Erreur detail annonce test');
    expect(element.textContent).toContain('Recharger cette annonce');
  });

  it('Given a loaded announcement, when reloadAnnouncement is called, then the API is called again', async () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    const getByIdMock = vi.fn().mockResolvedValue({
      id: 'ann-001',
      title: 'Titre',
      body: 'Corps.',
      priority: 'high',
      audienceType: 'all_participants',
      programId: null,
      cohortId: null,
      status: 'published',
      publishedAt: '2026-04-29T10:00:00.000Z',
      createdByUserId: 'user-1',
      createdAt: '2026-04-29T09:30:00.000Z',
      updatedAt: '2026-04-29T09:45:00.000Z',
    } satisfies AnnouncementDto);
    const component = fixture.componentInstance as unknown as {
      announcementsClient: { getById: (id: string) => Promise<unknown> };
      reloadAnnouncement: () => Promise<void>;
    };
    component.announcementsClient = { getById: getByIdMock };

    fixture.detectChanges();
    await fixture.whenStable();

    await component.reloadAnnouncement();

    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('Given a component instance, when getPriorityLabel is called with high, then it returns Elevée', () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    configureAnnouncementsClient(fixture, Promise.resolve({ id: 'ann-001' }));
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      getPriorityLabel: (p: AnnouncementDto['priority']) => string;
    };
    expect(component.getPriorityLabel('high')).toBe('Elev\u00E9e');
  });

  it('Given a component instance, when getPriorityLabel is called with normal, then it returns Normale', () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    configureAnnouncementsClient(fixture, Promise.resolve({ id: 'ann-001' }));
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      getPriorityLabel: (p: AnnouncementDto['priority']) => string;
    };
    expect(component.getPriorityLabel('normal')).toBe('Normale');
  });

  it('Given a component instance, when getPriorityLabel is called with low, then it returns Faible', () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    configureAnnouncementsClient(fixture, Promise.resolve({ id: 'ann-001' }));
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      getPriorityLabel: (p: AnnouncementDto['priority']) => string;
    };
    expect(component.getPriorityLabel('low')).toBe('Faible');
  });

  it('Given an announcement with empty title, when page renders, then pageTitle falls back to default', async () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    configureAnnouncementsClient(
      fixture,
      Promise.resolve({
        id: 'ann-001',
        title: '',
        body: 'Corps.',
        priority: 'low',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-29T10:00:00.000Z',
        createdByUserId: 'user-1',
        createdAt: '2026-04-29T09:30:00.000Z',
        updatedAt: '2026-04-29T09:45:00.000Z',
      } satisfies AnnouncementDto),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      pageTitle: (() => string) | string;
    };
    const title =
      typeof component.pageTitle === 'function'
        ? component.pageTitle()
        : component.pageTitle;
    expect(title).toBe("D\u00E9tail de l'annonce");
  });
});

describe('Mobile AnnouncementDetailPage — no announcementId', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    await TestBed.configureTestingModule({
      imports: [AnnouncementDetailPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('Given no announcementId in route, when page loads, then "Annonce introuvable." error is shown', async () => {
    const fixture = TestBed.createComponent(AnnouncementDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Annonce introuvable.');
  });
});
