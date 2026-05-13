import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ParticipantProgramDetailDto,
  ProgramAnnouncementPreviewDto,
  ResourceDto,
  SessionDto,
} from '@kraak/contracts';
import { MobileProgramsService } from './mobile-programs.service';
import ProgramDetailPage from './program-detail.page';

describe('Mobile ProgramDetailPage', () => {
  let service: { getProgramDetail: ReturnType<typeof vi.fn> };
  let activatedRoute: {
    snapshot: {
      paramMap: {
        get: ReturnType<typeof vi.fn>;
      };
    };
  };

  const mockCohort: NonNullable<ParticipantProgramDetailDto['cohort']> = {
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
    cohort: mockCohort,
    progress: {
      totalSessions: 0,
      completedSessions: 0,
      completionRate: 0,
      status: 'not_started',
      completedSessionIds: [],
      updatedAt: null,
    },
    sessions: [],
    resources: [],
    announcements: [],
  };

  beforeEach(async () => {
    service = {
      getProgramDetail: vi.fn(),
    };

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn((key: string) => {
            if (key === 'programId') {
              return 'prog-1';
            }
            return null;
          }),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProgramDetailPage],
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
    const fixture = TestBed.createComponent(ProgramDetailPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('On load', () => {
    it('Given the page is initialized with a program ID, when program loads successfully, then the detail is displayed', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      const fixture = TestBed.createComponent(ProgramDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Programme test');
      expect(element.textContent).toContain('Un programme de test');
      expect(element.textContent).toContain('Cohorte 1');
    });

    it('Given the page is initialized, when an error occurs, then error message is displayed', async () => {
      service.getProgramDetail.mockRejectedValue(new Error('API Error'));
      const fixture = TestBed.createComponent(ProgramDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('API Error');
    });
  });

  describe('Rich content', () => {
    const mockSession: SessionDto = {
      id: 'session-1',
      cohortId: 'cohort-1',
      title: 'Session de d\u00E9marrage',
      description: null,
      status: 'scheduled',
      startsAt: new Date('2026-06-01T10:00:00Z').toISOString(),
      endsAt: new Date('2026-06-01T12:00:00Z').toISOString(),
      locationType: 'onsite',
      locationLabel: 'Abidjan',
      meetingLink: null,
      trainerUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockSessionNoLocationType: SessionDto = {
      ...mockSession,
      id: 'session-2',
      title: 'Session en ligne',
      locationType: 'online',
    };

    const mockResourceWithContent: ResourceDto = {
      id: 'resource-1',
      programId: 'prog-1',
      cohortId: null,
      title: 'Guide de formation',
      description: 'Un guide complet',
      resourceType: 'document',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: 'https://example.com/guide.pdf',
      filePath: null,
      status: 'published',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockResourceNoContent: ResourceDto = {
      ...mockResourceWithContent,
      id: 'resource-2',
      title: 'Document annexe',
      description: null,
      url: null,
    };

    const mockAnnouncement: ProgramAnnouncementPreviewDto = {
      id: 'ann-1',
      title: 'Bienvenue dans le programme',
      audienceType: 'all_participants',
      publishedAt: new Date('2026-05-01').toISOString(),
    };

    it('Given a program with sessions, resources and announcements, when the page loads, then all sections are displayed', async () => {
      service.getProgramDetail.mockResolvedValue({
        ...mockProgramDetail,
        cohort: {
          ...mockCohort,
          endDate: new Date('2026-12-31').toISOString(),
        },
        sessions: [mockSession, mockSessionNoLocationType],
        resources: [mockResourceWithContent, mockResourceNoContent],
        announcements: [mockAnnouncement],
      } satisfies ParticipantProgramDetailDto);

      const fixture = TestBed.createComponent(ProgramDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Sessions (2)');
      expect(element.textContent).toContain('Session de d\u00E9marrage');
      expect(element.textContent).toContain('Ressources (2)');
      expect(element.textContent).toContain('Guide de formation');
      expect(element.textContent).toContain('Un guide complet');
      expect(element.textContent).toContain('Annonces (1)');
      expect(element.textContent).toContain('Bienvenue dans le programme');
    });

    it('Given a program with a null cohort, when the page loads, then the cohort section is not displayed', async () => {
      service.getProgramDetail.mockResolvedValue({
        ...mockProgramDetail,
        cohort: null,
        sessions: [],
        resources: [],
        announcements: [],
      } satisfies ParticipantProgramDetailDto);

      const fixture = TestBed.createComponent(ProgramDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).not.toContain('Cohorte');
    });

    it('Given a loaded program, when reloadProgram is called, then the service is called again', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      const fixture = TestBed.createComponent(ProgramDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      await (
        fixture.componentInstance as unknown as {
          reloadProgram: () => Promise<void>;
        }
      ).reloadProgram();

      expect(service.getProgramDetail).toHaveBeenCalledTimes(2);
    });

    it('Given no programId in route, when reloadProgram is called, then the service is not called again', async () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      const fixture = TestBed.createComponent(ProgramDetailPage);
      fixture.detectChanges();
      await fixture.whenStable();

      activatedRoute.snapshot.paramMap.get = vi.fn().mockReturnValue(null);
      await (
        fixture.componentInstance as unknown as {
          reloadProgram: () => Promise<void>;
        }
      ).reloadProgram();

      expect(service.getProgramDetail).toHaveBeenCalledTimes(1);
    });

    it('Given programDetail is null before load, when pageTitle is read, then it returns the default title', () => {
      service.getProgramDetail.mockResolvedValue(mockProgramDetail);
      const fixture = TestBed.createComponent(ProgramDetailPage);

      const title = (
        fixture.componentInstance as unknown as {
          pageTitle: () => string;
        }
      ).pageTitle();

      expect(title).toBe('Programme');
    });
  });
});
