import { ApplicationInitStatus, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantProgramListItemDto } from '@kraak/contracts';
import { MobileProgramsService } from './mobile-programs.service';
import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import ProgramListPage from './program-list.page';

describe('Mobile ProgramListPage', () => {
  it('Given une date invalide, When sa présentation est demandée, Then la valeur originale est conservée', () => {
    const page = TestBed.createComponent(ProgramListPage).componentInstance;
    expect(page['formatShortDate']('date invalide')).toBe('date invalide');
  });
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
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    service = {
      listPrograms: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProgramListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        { provide: MobileProgramsService, useValue: service },
      ],
    }).compileComponents();
    await TestBed.inject(ApplicationInitStatus).donePromise;
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

  it('Given English locale, when programs render, then the page chrome and enrollment status are translated', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('en-GB');

    service.listPrograms.mockResolvedValue([mockProgramListItem]);

    const fixture = TestBed.createComponent(ProgramListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const content = element.textContent ?? '';

    expect(content).toContain('Your learning paths');
    expect(content).toContain("Explore the programmes you're enrolled in.");
    expect(content).toContain('Status: Active');
    expect(content).toContain('Progress: 0% (0/0 sessions)');
    expect(content).toContain('View details');

    // Business content remains unchanged until Layer 6.
    expect(content).toContain('Programme test');
    expect(content).toContain('Un programme de test');
  });
});
