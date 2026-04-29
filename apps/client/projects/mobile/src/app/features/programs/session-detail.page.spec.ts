import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import { MobileProgramsService } from './mobile-programs.service';
import SessionDetailPage from './session-detail.page';

describe('Mobile SessionDetailPage', () => {
  let service: { getProgramDetail: ReturnType<typeof vi.fn> };
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
  });
});
