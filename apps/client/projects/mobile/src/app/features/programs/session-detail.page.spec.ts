import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import { MobileProgramsService } from './mobile-programs.service';
import SessionDetailPage from './session-detail.page';

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
        meetingLink: 'https://meet.example.com/session1',
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

    it('Given the page is initialized, when an error occurs, then error message is displayed', async () => {
      service.getProgramDetail.mockRejectedValue(new Error('API Error'));
      const fixture = TestBed.createComponent(SessionDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('API Error');
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
  });
});
