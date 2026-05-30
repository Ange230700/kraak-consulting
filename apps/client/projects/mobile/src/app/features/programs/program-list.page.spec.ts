import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramListItemDto } from '@kraak/contracts';
import { MobileProgramsService } from './mobile-programs.service';
import ProgramListPage from './program-list.page';

describe('Mobile ProgramListPage', () => {
  let service: { listPrograms: ReturnType<typeof vi.fn> };

  const mockProgramListItem: ParticipantProgramListItemDto = {
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
    cohort: null,
    progress: {
      totalSessions: 0,
      completedSessions: 0,
      completionRate: 0,
      status: 'not_started',
      completedSessionIds: [],
      updatedAt: null,
    },
  };

  beforeEach(async () => {
    service = {
      listPrograms: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProgramListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileProgramsService, useValue: service },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    service.listPrograms.mockResolvedValue([]);
    const fixture = TestBed.createComponent(ProgramListPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('On load', () => {
    it('Given the page is initialized, when programs load successfully, then the list is displayed', async () => {
      service.listPrograms.mockResolvedValue([mockProgramListItem]);
      const fixture = TestBed.createComponent(ProgramListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Vos parcours');
      expect(element.textContent).toContain('Programme test');
      expect(element.textContent).toContain('Un programme de test');
    });

    it('Given a program has cohort metadata, when programs load successfully, then cohort name and start date are displayed', async () => {
      service.listPrograms.mockResolvedValue([
        {
          ...mockProgramListItem,
          cohort: {
            id: 'cohort-1',
            programId: 'prog-1',
            name: 'Cohorte pilote',
            code: 'COH-001',
            status: 'active',
            startDate: '2026-01-15T09:00:00.000Z',
            endDate: null,
            capacity: 20,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ]);

      const fixture = TestBed.createComponent(ProgramListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Cohorte: Cohorte pilote');
      expect(element.textContent).toContain('Début:');
    });

    it('Given a program has cohort metadata without start date, when programs load successfully, then cohort is shown without start date line', async () => {
      service.listPrograms.mockResolvedValue([
        {
          ...mockProgramListItem,
          cohort: {
            id: 'cohort-2',
            programId: 'prog-1',
            name: 'Cohorte sans date',
            code: 'COH-002',
            status: 'active',
            startDate: null,
            endDate: null,
            capacity: 20,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ]);

      const fixture = TestBed.createComponent(ProgramListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('Cohorte: Cohorte sans date');
      expect(element.textContent).not.toContain('Début:');
    });

    it('Given the page is initialized, when no programs are available, then empty state is displayed', async () => {
      service.listPrograms.mockResolvedValue([]);
      const fixture = TestBed.createComponent(ProgramListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain(
        "Aucun programme n'est actuellement disponible",
      );
    });

    it('Given the page is initialized, when an error occurs, then error message is displayed', async () => {
      service.listPrograms.mockRejectedValue(new Error('API Error'));
      const fixture = TestBed.createComponent(ProgramListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toContain('API Error');
    });

    it('Given the user retries, when reloadPrograms is called, then programs are requested again', async () => {
      service.listPrograms.mockResolvedValue([mockProgramListItem]);
      const fixture = TestBed.createComponent(ProgramListPage);

      await fixture.componentInstance['reloadPrograms']();

      expect(service.listPrograms).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['loading']()).toBe(false);
      expect(fixture.componentInstance['programs']()).toEqual([
        mockProgramListItem,
      ]);
    });
  });
});
