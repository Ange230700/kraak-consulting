import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import ProgramDetailPage from './program-detail.page';

describe('Web Participant ProgramDetailPage', () => {
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
  };

  beforeEach(async () => {
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
      }),
    );
    const text = fixture.nativeElement.textContent ?? '';

    expect(text).toContain('Parcours individuel');
    expect(text).toContain('Aucune session programmée');
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
});
