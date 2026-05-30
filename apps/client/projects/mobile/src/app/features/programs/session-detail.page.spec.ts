import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import { MobileProgramsService } from './mobile-programs.service';
import SessionDetailPage from './session-detail.page';

const TEST_MEETING_LINK_URL = 'https://meet.example.com/session1';

describe('Mobile SessionDetailPage', () => {
  let service: {
    getProgramDetail: ReturnType<typeof vi.fn>;
    markSessionProgress: ReturnType<typeof vi.fn>;
  };
  let activatedRoute: {
    snapshot: {
      paramMap: {
        get: ReturnType<typeof vi.fn>;
      };
    };
  };

  const mockProgramDetail: ParticipantProgramDetailDto = {
    enrollmentId: 'enr-1',
    enrollmentStatus: 'active',
    program: {
      id: 'prog-1',
      slug: 'programme-1',
      title: 'Programme test',
      summary: 'Un programme de test',
      description: 'Description du programme',
      status: 'published',
      visibility: 'participants',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    cohort: {
      id: 'cohort-1',
      programId: 'prog-1',
      name: 'Cohorte 1',
      code: 'COH-001',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: null,
      capacity: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    sessions: [
      {
        id: 'session-1',
        cohortId: 'cohort-1',
        title: 'Session 1',
        description: 'Description de la session',
        status: 'scheduled',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        locationType: 'online',
        locationLabel: null,
        meetingLink: TEST_MEETING_LINK_URL,
        trainerUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    progress: {
      totalSessions: 1,
      completedSessions: 0,
      completionRate: 0,
      status: 'not_started',
      completedSessionIds: [],
      updatedAt: null,
    },
    resources: [],
    announcements: [],
  };

  beforeEach(async () => {
    service = {
      getProgramDetail: vi.fn(),
      markSessionProgress: vi.fn(),
    };

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
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileProgramsService, useValue: service },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    service.getProgramDetail.mockResolvedValue(mockProgramDetail);
    const fixture = TestBed.createComponent(SessionDetailPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('On load', () => {
    it('Given the page is initialized with program and session IDs, when session loads successfully, then the session detail is displayed', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Session 1');
      expect(element.textContent).toContain('Description de la session');
      expect(element.textContent).toContain('online');
    });

    it('Given a detailed session with location label and completed progress, when session loads, then location and completed action are displayed', async () => {
      service.getProgramDetail.mockResolvedValue({
        ...mockProgramDetail,
        sessions: [
          {
            ...mockProgramDetail.sessions[0],
            locationLabel: 'Salle A12',
          },
        ],
        progress: {
          ...mockProgramDetail.progress,
          completedSessionIds: ['session-1'],
          completedSessions: 1,
          completionRate: 100,
          status: 'completed',
        },
      });

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Lieu');
      expect(element.textContent).toContain('Salle A12');
      expect(element.textContent).toContain('Session marquée comme terminée.');
      expect(element.textContent).toContain('Marquer comme non terminée');
    });

    it('Given a session without optional description and meeting link, when session loads, then optional blocks are not rendered', async () => {
      service.getProgramDetail.mockResolvedValue({
        ...mockProgramDetail,
        sessions: [
          {
            ...mockProgramDetail.sessions[0],
            description: null,
            meetingLink: null,
          },
        ],
      });

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).not.toContain('Rejoindre la session');
      expect(element.textContent).not.toContain('Lien de réunion');
      expect(element.textContent).not.toContain('Description de la session');
    });

    it('Given the page is initialized, when an error occurs, then error message is displayed', async () => {
      service.getProgramDetail.mockRejectedValue(new Error('API Error'));
      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('API Error');
    });

    it('Given detail loading is still pending, when the page renders, then the loading state is displayed', async () => {
      service.getProgramDetail.mockImplementation(
        () => new Promise(() => undefined),
      );

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Chargement de la session...');
    });

    it('Given a loaded session, when markSessionCompletion succeeds, then progression API is called and detail is reloaded', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      service.markSessionProgress.mockResolvedValue({
        enrollmentId: 'enr-1',
        enrollmentStatus: 'completed',
        progress: {
          totalSessions: 1,
          completedSessions: 1,
          completionRate: 100,
          status: 'completed',
          completedSessionIds: ['session-1'],
          updatedAt: new Date().toISOString(),
        },
      });

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await (
        fixture.componentInstance as unknown as {
          markSessionCompletion: (completed: boolean) => Promise<void>;
        }
      ).markSessionCompletion(true);

      expect(service.markSessionProgress).toHaveBeenCalledWith(
        'prog-1',
        'session-1',
        true,
      );
      expect(service.getProgramDetail).toHaveBeenCalledTimes(2);
    });

    it('Given a loaded session, when markSessionCompletion fails with non-Error rejection, then generic error is shown', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      service.markSessionProgress.mockRejectedValue('string rejection');

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await (
        fixture.componentInstance as unknown as {
          markSessionCompletion: (completed: boolean) => Promise<void>;
        }
      ).markSessionCompletion(true);

      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(
        'Impossible de mettre \u00E0 jour votre progression.',
      );
    });

    it('Given a loaded session, when markSessionCompletion fails with an Error instance, then the exact error message is shown', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      service.markSessionProgress.mockRejectedValue(
        new Error('Erreur progression explicite'),
      );

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await (
        fixture.componentInstance as unknown as {
          markSessionCompletion: (completed: boolean) => Promise<void>;
        }
      ).markSessionCompletion(true);

      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Erreur progression explicite');
    });

    it('Given markingProgress is true, when markSessionCompletion is called, then the service is not called again', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      (
        fixture.componentInstance as unknown as {
          markingProgress: { set: (v: boolean) => void };
        }
      ).markingProgress.set(true);

      await (
        fixture.componentInstance as unknown as {
          markSessionCompletion: (completed: boolean) => Promise<void>;
        }
      ).markSessionCompletion(true);

      expect(service.markSessionProgress).not.toHaveBeenCalled();
    });

    it('Given a keydown event on reload, when onReloadKeydown is called, then session is reloaded', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      (
        fixture.componentInstance as unknown as {
          onReloadKeydown: (event: Event) => void;
        }
      ).onReloadKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      await fixture.whenStable();

      expect(service.getProgramDetail).toHaveBeenCalledTimes(2);
    });

    it('Given a keydown event on mark, when onMarkKeydown is called, then markSessionCompletion is triggered', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      service.markSessionProgress.mockResolvedValue({
        enrollmentId: 'enr-1',
        enrollmentStatus: 'completed',
        progress: {
          totalSessions: 1,
          completedSessions: 1,
          completionRate: 100,
          status: 'completed',
          completedSessionIds: ['session-1'],
          updatedAt: new Date().toISOString(),
        },
      });

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      (
        fixture.componentInstance as unknown as {
          onMarkKeydown: (event: Event, completed: boolean) => void;
        }
      ).onMarkKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), true);
      await fixture.whenStable();

      expect(service.markSessionProgress).toHaveBeenCalledWith(
        'prog-1',
        'session-1',
        true,
      );
    });

    it('Given a loaded program detail but an unknown sessionId, when computed state is read, then session is null and isSessionCompleted is false', async () => {
      activatedRoute.snapshot.paramMap.get.mockImplementation((key: string) => {
        if (key === 'programId') {
          return 'prog-1';
        }
        if (key === 'sessionId') {
          return 'session-inconnue';
        }
        return null;
      });
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      const component = fixture.componentInstance as unknown as {
        session: () => unknown;
        isSessionCompleted: () => boolean;
      };

      expect(component.session()).toBeNull();
      expect(component.isSessionCompleted()).toBe(false);
    });
  });

  describe('On load without programId', () => {
    it('Given no programId in route, when reloadSession is called, then service is not called', async () => {
      activatedRoute.snapshot.paramMap.get.mockImplementation(() => null);

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await (
        fixture.componentInstance as unknown as {
          reloadSession: () => Promise<void>;
        }
      ).reloadSession();

      expect(service.getProgramDetail).not.toHaveBeenCalled();
    });

    it('Given no session can be resolved and loading is false, when the page renders, then the not-found fallback is displayed', async () => {
      activatedRoute.snapshot.paramMap.get.mockImplementation(() => null);

      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const component = fixture.componentInstance as unknown as {
        loading: { set: (value: boolean) => void };
        errorMessage: { set: (value: string | null) => void };
      };
      component.loading.set(false);
      component.errorMessage.set(null);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(
        "La session n'a pas pu être trouvée.",
      );
      expect(element.textContent).toContain('Retour au programme');
    });
  });
});
