import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
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
});
