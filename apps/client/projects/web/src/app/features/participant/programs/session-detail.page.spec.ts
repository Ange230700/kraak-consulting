import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import SessionDetailPage from './session-detail.page';

describe('Web Participant SessionDetailPage', () => {
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
      description: 'Description du programme.',
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
      endDate: null,
      capacity: 20,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    progress: {
      totalSessions: 2,
      completedSessions: 0,
      completionRate: 0,
      status: 'not_started',
      completedSessionIds: [],
      updatedAt: null,
    },
    sessions: [
      {
        id: 'session-1',
        cohortId: 'cohort-1',
        title: 'Session de démarrage',
        description: 'Présentation du parcours.',
        status: 'scheduled',
        startsAt: '2026-02-01T10:00:00.000Z',
        endsAt: '2026-02-01T12:00:00.000Z',
        locationType: 'online',
        locationLabel: 'Classe virtuelle',
        meetingLink: 'https://meet.example.com/session-1',
        trainerUserId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    resources: [],
    announcements: [],
  };

  beforeEach(async () => {
    activatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => {
            if (key === 'programId') {
              return 'prog-1';
            }
            if (key === 'sessionId') {
              return 'session-1';
            }
            return null;
          }),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [SessionDetailPage],
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
    fixture: ReturnType<typeof TestBed.createComponent<SessionDetailPage>>,
    getByIdResult: Promise<ParticipantProgramDetailDto>,
  ): {
    getById: ReturnType<typeof vi.fn>;
    markSessionProgress: ReturnType<typeof vi.fn>;
  } {
    const client = {
      getById: vi.fn().mockImplementation(() => getByIdResult),
      markSessionProgress: vi.fn().mockResolvedValue({
        enrollmentId: 'enr-1',
        enrollmentStatus: 'active',
        progress: detail.progress,
      }),
    };

    fixture.componentInstance['programsClient'] = client;
    return client;
  }

  async function render(
    result: Promise<ParticipantProgramDetailDto>,
  ): Promise<ReturnType<typeof TestBed.createComponent<SessionDetailPage>>> {
    const fixture = TestBed.createComponent(SessionDetailPage);
    configureClient(fixture, result);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('Given valid program and session ids, When detail loads, Then the session information and meeting action are rendered', async () => {
    const fixture = await render(Promise.resolve(detail));
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('Session de démarrage');
    expect(text).toContain('Présentation du parcours.');
    expect(text).toContain('En ligne');
    expect(text).toContain('Classe virtuelle');
    expect(text).toContain('Session non terminée.');

    const meetingLink = element.querySelector(
      'a[href="https://meet.example.com/session-1"]',
    );
    expect(meetingLink?.getAttribute('target')).toBe('_blank');
    expect(meetingLink?.getAttribute('rel')).toContain('noopener');
  });

  it('Given the session is completed, When detail loads, Then the completed state and reversal action are rendered', async () => {
    const fixture = await render(
      Promise.resolve({
        ...detail,
        progress: {
          ...detail.progress,
          completedSessions: 1,
          completionRate: 50,
          status: 'in_progress',
          completedSessionIds: ['session-1'],
        },
      }),
    );
    const text = fixture.nativeElement.textContent ?? '';

    expect(text).toContain('Session marquée comme terminée.');
    expect(text).toContain('Marquer comme non terminée');
    expect(text).toContain('50%');
  });

  it('Given the session has no optional meeting or location label, When detail loads, Then no meeting action is rendered', async () => {
    const fixture = await render(
      Promise.resolve({
        ...detail,
        sessions: [
          {
            ...detail.sessions[0]!,
            locationLabel: null,
            meetingLink: null,
          },
        ],
      }),
    );
    const text = fixture.nativeElement.textContent ?? '';

    expect(text).toContain('Non précisé');
    expect(text).not.toContain('Rejoindre la session');
  });

  it('Given session loading fails, When the page settles, Then the resolved error and retry action are rendered', async () => {
    const fixture = await render(Promise.reject(new Error('API Error')));
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('API Error');
    expect(element.querySelector('button')?.textContent).toContain('Réessayer');
  });

  it('Given an incomplete session, When completion succeeds, Then progress is persisted and canonical detail is reloaded', async () => {
    const fixture = TestBed.createComponent(SessionDetailPage);
    const client = {
      getById: vi.fn().mockResolvedValue(detail),
      markSessionProgress: vi.fn().mockResolvedValue({
        enrollmentId: 'enr-1',
        enrollmentStatus: 'active',
        progress: {
          ...detail.progress,
          completedSessions: 1,
          completionRate: 50,
          status: 'in_progress',
          completedSessionIds: ['session-1'],
        },
      }),
    };

    fixture.componentInstance['programsClient'] = client;
    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance['markSessionCompletion'](true);

    expect(client.markSessionProgress).toHaveBeenCalledWith('prog-1', {
      sessionId: 'session-1',
      completed: true,
    });
    expect(client.getById).toHaveBeenCalledTimes(2);
  });

  it('Given completion persistence fails, When the participant marks the session, Then the exact error is rendered', async () => {
    const fixture = TestBed.createComponent(SessionDetailPage);
    const client = configureClient(fixture, Promise.resolve(detail));
    client.markSessionProgress.mockRejectedValue(
      new Error('Erreur progression explicite'),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance['markSessionCompletion'](true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Erreur progression explicite',
    );
  });

  it('Given an unknown session id, When program detail loads, Then the not-found state is rendered', async () => {
    activatedRoute.snapshot.paramMap.get.mockImplementation((key: string) => {
      if (key === 'programId') {
        return 'prog-1';
      }
      if (key === 'sessionId') {
        return 'missing-session';
      }
      return null;
    });

    const fixture = await render(Promise.resolve(detail));

    expect(fixture.nativeElement.textContent).toContain('Session introuvable');
  });

  it('Given no program id, When the page initializes, Then no API request is made', async () => {
    activatedRoute.snapshot.paramMap.get.mockReturnValue(null);

    const fixture = TestBed.createComponent(SessionDetailPage);
    const client = configureClient(fixture, Promise.resolve(detail));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(client.getById).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Session introuvable');
  });
});
