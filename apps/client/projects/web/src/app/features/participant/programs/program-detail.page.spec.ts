import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import ProgramDetailPage from './program-detail.page';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';

describe('Web Participant ProgramDetailPage', () => {
  it('Given tous les états du programme, When les libellés sont demandés, Then les traductions couvrent chaque état métier', () => {
    const page = TestBed.createComponent(ProgramDetailPage).componentInstance;
    const i18n = TestBed.inject(KraakI18nService);
    for (const status of [
      'pending',
      'active',
      'completed',
      'cancelled',
    ] as const) {
      expect(page['enrollmentStatusLabel'](status)).toBe(
        i18n.translate(
          `web.participant.programDetail.status.enrollment.${status}`,
        ),
      );
    }
    for (const [status, key] of [
      ['not_started', 'notStarted'],
      ['in_progress', 'inProgress'],
      ['completed', 'completed'],
    ] as const) {
      expect(page['progressStatusLabel'](status)).toBe(
        i18n.translate(`web.participant.programDetail.status.progress.${key}`),
      );
    }
    for (const status of [
      'scheduled',
      'live',
      'completed',
      'cancelled',
    ] as const) {
      expect(page['sessionStatusLabel'](status)).toBe(
        i18n.translate(
          `web.participant.programDetail.status.session.${status}`,
        ),
      );
    }
    for (const type of ['online', 'onsite', 'hybrid'] as const) {
      expect(page['locationTypeLabel'](type)).toBe(
        i18n.translate(`web.participant.programDetail.status.location.${type}`),
      );
    }
    for (const type of ['link', 'file', 'video', 'document'] as const) {
      expect(page['resourceTypeLabel'](type)).toBe(
        i18n.translate(
          `web.participant.programDetail.status.resourceType.${type}`,
        ),
      );
    }
    for (const [theme, key] of [
      ['training', 'training'],
      ['project_management', 'projectManagement'],
      ['immigration', 'immigration'],
      ['career', 'career'],
    ] as const) {
      expect(page['resourceThemeLabel'](theme)).toBe(
        i18n.translate(
          `web.participant.programDetail.status.resourceTheme.${key}`,
        ),
      );
    }
    expect(page['formatDate'](null)).toBe(
      i18n.translate('web.participant.programDetail.date.upcoming'),
    );
    expect(page['formatDate']('invalide')).toBe('invalide');
    expect(page['formatDateTime']('invalide')).toBe('invalide');
  });

  it.each([null, {}, { accessToken: 'test-token' }])(
    'Given une session %j, When le programme est rechargé, Then la requête conserve langue et authentification',
    async (session) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          new Response(JSON.stringify(detail), { status: 200 }),
        );
      vi.spyOn(
        TestBed.inject(WebAuthService),
        'currentSession',
      ).mockReturnValue(
        session as ReturnType<WebAuthService['currentSession']>,
      );
      const page = TestBed.createComponent(ProgramDetailPage).componentInstance;
      await page['reloadProgram']();
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(page['programDetail']()).toEqual(detail);
      fetchMock.mockRestore();
    },
  );

  it('Given aucun identifiant de programme, When le rechargement est demandé, Then aucun appel réseau n’est effectué', async () => {
    activatedRoute.snapshot.paramMap.get.mockReturnValue(null);
    const page = TestBed.createComponent(ProgramDetailPage).componentInstance;
    const getById = vi.fn();
    page['programsClient'] = { getById };
    await page['reloadProgram']();
    expect(getById).not.toHaveBeenCalled();
  });
  let activatedRoute: {
    snapshot: {
      paramMap: {
        get: ReturnType<typeof vi.fn>;
      };
    };
  };

  const detail: ParticipantProgramDetailDto = {
    enrollmentId: 'enr-1',
    enrollmentStatus: 'active',
    program: {
      id: 'prog-1',
      slug: 'programme-test',
      title: 'Programme test',
      summary: 'Un programme de test',
      description: 'Description complète du programme.',
      status: 'published',
      visibility: 'participants',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    cohort: {
      id: 'cohort-1',
      programId: 'prog-1',
      name: 'Cohorte pilote',
      code: 'COH-001',
      status: 'active',
      startDate: '2026-01-15T09:00:00.000Z',
      endDate: '2026-06-30T17:00:00.000Z',
      capacity: 20,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    progress: {
      totalSessions: 4,
      completedSessions: 1,
      completionRate: 25,
      status: 'in_progress',
      completedSessionIds: ['session-0'],
      updatedAt: '2026-01-20T00:00:00.000Z',
    },
    sessions: [
      {
        id: 'session-1',
        cohortId: 'cohort-1',
        title: 'Session de démarrage',
        description: 'Présentation du parcours et des objectifs.',
        status: 'scheduled',
        startsAt: '2026-02-01T10:00:00.000Z',
        endsAt: '2026-02-01T12:00:00.000Z',
        locationType: 'online',
        locationLabel: null,
        meetingLink: 'https://meet.example.com/session-1',
        trainerUserId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    resources: [
      {
        id: 'resource-1',
        programId: 'prog-1',
        cohortId: null,
        title: 'Guide de formation',
        description: 'Document de référence.',
        resourceType: 'document',
        resourceTheme: 'training',
        resourceAudience: 'all',
        url: 'https://example.com/guide.pdf',
        filePath: null,
        status: 'published',
        publishedAt: '2026-01-10T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    announcements: [
      {
        id: 'announcement-1',
        title: 'Bienvenue dans le programme',
        audienceType: 'all_participants',
        publishedAt: '2026-01-12T00:00:00.000Z',
      },
    ],
    curriculum: {
      courses: [
        {
          placement: {
            id: 'program-course-1',
            programId: 'prog-1',
            courseId: 'course-1',
            sortOrder: 0,
            isRequired: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          course: {
            id: 'course-1',
            slug: 'leadership-foundations',
            title: 'Fondamentaux du leadership',
            summary: 'Construire les bases du leadership.',
            description: 'Cours principal du programme.',
            status: 'published',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          modules: [
            {
              placement: {
                id: 'course-module-1',
                courseId: 'course-1',
                learningModuleId: 'module-1',
                sortOrder: 0,
                isRequired: true,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              learningModule: {
                id: 'module-1',
                slug: 'self-leadership',
                title: 'Leadership de soi',
                summary: 'Commencer par soi-même.',
                description: 'Module consacré au leadership personnel.',
                status: 'published',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
              chapters: [
                {
                  chapter: {
                    id: 'chapter-1',
                    learningModuleId: 'module-1',
                    slug: 'introduction',
                    title: 'Comprendre son rôle',
                    summary: 'Introduction au leadership personnel.',
                    status: 'published',
                    sortOrder: 0,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                  },
                  lessons: [
                    {
                      placement: {
                        id: 'chapter-lesson-1',
                        chapterId: 'chapter-1',
                        lessonId: 'lesson-1',
                        sortOrder: 0,
                        isRequired: true,
                        createdAt: '2026-01-01T00:00:00.000Z',
                        updatedAt: '2026-01-01T00:00:00.000Z',
                      },
                      lesson: {
                        id: 'lesson-1',
                        slug: 'leading-yourself',
                        title: 'Se diriger avant de diriger',
                        summary: 'Première leçon du parcours.',
                        description:
                          'Introduction aux principes de maîtrise de soi.',
                        status: 'published',
                        createdAt: '2026-01-01T00:00:00.000Z',
                        updatedAt: '2026-01-01T00:00:00.000Z',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    activatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => (key === 'programId' ? 'prog-1' : null)),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProgramDetailPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        {
          provide: WebAuthService,
          useValue: {
            currentSession: () => null,
          },
        },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  function configureClient(
    fixture: ReturnType<typeof TestBed.createComponent<ProgramDetailPage>>,
    result: Promise<ParticipantProgramDetailDto>,
  ): ReturnType<typeof vi.fn> {
    const getById = vi.fn().mockImplementation(() => result);
    fixture.componentInstance['programsClient'] = { getById };
    return getById;
  }

  async function render(
    result: Promise<ParticipantProgramDetailDto>,
  ): Promise<ReturnType<typeof TestBed.createComponent<ProgramDetailPage>>> {
    const fixture = TestBed.createComponent(ProgramDetailPage);
    configureClient(fixture, result);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('Given a program id, When detail loads, Then it renders the program, progression and cohort', async () => {
    const fixture = await render(Promise.resolve(detail));
    const text = fixture.nativeElement.textContent ?? '';

    expect(text).toContain('Programme test');
    expect(text).toContain('Un programme de test');
    expect(text).toContain('Description complète du programme.');
    expect(text).toContain('25%');
    expect(text).toContain('1/4');
    expect(text).toContain('Cohorte pilote');
    expect(text).toContain('COH-001');
  });

  it('Given rich LMS content, When detail loads, Then sessions, resources and announcements are rendered', async () => {
    const fixture = await render(Promise.resolve(detail));
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('Session de démarrage');
    expect(text).toContain('En ligne');
    expect(text).toContain('Guide de formation');
    expect(text).toContain('Document de référence.');
    expect(text).toContain('Formation');
    expect(text).toContain('Bienvenue dans le programme');
    expect(text).toContain('Contenu pédagogique');
    expect(text).toContain('Fondamentaux du leadership');
    expect(text).toContain('Leadership de soi');
    expect(text).toContain('Comprendre son rôle');
    expect(text).toContain('Se diriger avant de diriger');

    const externalResource = element.querySelector(
      'a[href="https://example.com/guide.pdf"]',
    );
    expect(externalResource?.getAttribute('target')).toBe('_blank');
    expect(externalResource?.getAttribute('rel')).toContain('noopener');

    expect(
      element.querySelector(
        'a[href="/participant/programmes/prog-1/sessions/session-1"]',
      ),
    ).not.toBeNull();
  });

  it('Given optional collections are empty and cohort is null, When detail loads, Then useful empty states are rendered', async () => {
    const fixture = await render(
      Promise.resolve({
        ...detail,
        cohort: null,
        sessions: [],
        resources: [],
        announcements: [],
        curriculum: { courses: [] },
      }),
    );
    const text = fixture.nativeElement.textContent ?? '';

    expect(text).toContain('Parcours individuel');
    expect(text).toContain('Aucune session programmée');
    expect(text).toContain('Aucun contenu pédagogique publié');
    expect(text).toContain('Aucune ressource disponible');
    expect(text).toContain('Aucune annonce liée');
  });

  it('Given detail loading fails, When the page settles, Then the resolved error and retry action are shown', async () => {
    const fixture = await render(Promise.reject(new Error('API Error')));
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('API Error');
    expect(element.querySelector('button')?.textContent).toContain('Réessayer');
  });

  it('Given a failed load, When retry succeeds, Then the program is requested again and rendered', async () => {
    const fixture = TestBed.createComponent(ProgramDetailPage);
    const getById = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(detail);

    fixture.componentInstance['programsClient'] = { getById };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const retry = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getById).toHaveBeenCalledTimes(2);
    expect(getById).toHaveBeenLastCalledWith('prog-1');
    expect(fixture.nativeElement.textContent).toContain('Programme test');
  });

  it('Given the route has no program id, When the page initializes, Then no API request is made and not-found state is shown', async () => {
    activatedRoute.snapshot.paramMap.get.mockReturnValue(null);

    const fixture = TestBed.createComponent(ProgramDetailPage);
    const getById = configureClient(fixture, Promise.resolve(detail));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getById).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Programme introuvable',
    );
  });

  it('Given English locale, When rich programme detail loads, Then it renders the complete programme detail chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = await render(Promise.resolve(detail));
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('All programmes');

    expect(text).toContain('Active');
    expect(text).toContain('In progress');
    expect(text).toContain('Progress');
    expect(text).toContain('sessions completed');

    expect(text).toContain('About');
    expect(text).toContain('Your journey');
    expect(text).toContain('Key details');
    expect(text).toContain('Start');
    expect(text).toContain('End');
    expect(text).toContain('Capacity');

    expect(text).toContain('Learning content');
    expect(text).toContain('Required');
    expect(text).toContain('Chapter 1');

    expect(text).toContain('Journey');
    expect(text).toContain('Sessions');
    expect(text).toContain('Scheduled');
    expect(text).toContain('Online');
    expect(text).toContain('Open session');

    expect(text).toContain('Library');
    expect(text).toContain('Resources');
    expect(text).toContain('Document');

    expect(text).toContain('News');
    expect(text).toContain('Announcements');
    expect(text).toContain('Published on');

    const externalResource = element.querySelector(
      'a[href="https://example.com/guide.pdf"]',
    );

    expect(externalResource?.getAttribute('aria-label')).toBe(
      'Open Guide de formation',
    );

    expect(i18n.translate('web.participant.programDetail.notFound.title')).toBe(
      'Programme not found',
    );

    expect(i18n.translate('web.participant.programDetail.error.retry')).toBe(
      'Try again',
    );
  });
});
