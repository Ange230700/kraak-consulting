import { ApplicationInitStatus } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CourseDto, ProgramCourseDto, ProgramDto } from '@kraak/contracts';
import { vi } from 'vitest';

import { WebAuthService } from '../../../core/auth/web-auth.service';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';

import AdminCurriculumPage from './admin-curriculum.page';

const program: ProgramDto = {
  id: 'program-1',
  slug: 'leadership',
  title: 'Programme Leadership',
  summary: 'Résumé programme',
  description: 'Description programme',
  status: 'published',
  visibility: 'private',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondProgram: ProgramDto = {
  ...program,
  id: 'program-2',
  slug: 'management',
  title: 'Programme Management',
};

const course: CourseDto = {
  id: 'course-1',
  slug: 'leadership-fondamentaux',
  title: 'Fondamentaux du leadership',
  summary: 'Bases du leadership.',
  description: 'Description complète.',
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const placement: ProgramCourseDto = {
  id: 'placement-1',
  programId: 'program-1',
  courseId: 'course-1',
  sortOrder: 0,
  isRequired: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondPlacement: ProgramCourseDto = {
  ...placement,
  id: 'placement-2',
  programId: secondProgram.id,
  courseId: 'course-2',
  sortOrder: 4,
};

const authMock = {
  currentSession: signal(null),
  isAuthenticated: signal(false),
  isAdmin: signal(false),
};

describe('AdminCurriculumPage', () => {
  function createPage(): AdminCurriculumPage {
    const page = TestBed.createComponent(AdminCurriculumPage).componentInstance;
    page.programsClient = { list: vi.fn().mockResolvedValue([]) };
    page.coursesClient = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(course),
      update: vi.fn().mockResolvedValue({ ...course, title: 'Cours modifié' }),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    page.programCoursesClient = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(placement),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    return page;
  }

  it.each([null, {}, { accessToken: 'test-token' }])(
    'Given une session %j, When le client réel charge le catalogue, Then les requêtes reçoivent le jeton disponible et la langue',
    async (currentSession) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('[]', { status: 200 }));
      const session = vi
        .spyOn(TestBed.inject(WebAuthService), 'currentSession')
        .mockReturnValue(
          currentSession as ReturnType<WebAuthService['currentSession']>,
        );
      const page =
        TestBed.createComponent(AdminCurriculumPage).componentInstance;
      await page.loadInitialData();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
      expect(headers.get('Authorization')).toBe(
        currentSession && 'accessToken' in currentSession
          ? 'Bearer test-token'
          : null,
      );
      expect(headers.get('Accept-Language')).toBe(
        TestBed.inject(KraakI18nService).locale(),
      );
      expect(page['courses']()).toEqual([]);
      fetchMock.mockRestore();
      session.mockRestore();
    },
  );
  it('Given aucun programme, When les données sont chargées, Then la sélection et les affectations sont vides', async () => {
    const page = createPage();
    await page.loadInitialData();
    expect(page['selectedProgramId']()).toBeNull();
    expect(page['selectedProgram']()).toBeNull();
    expect(page['placements']()).toEqual([]);
    expect(page['loading']()).toBe(false);
  });

  it('Given un catalogue indisponible, When les données sont chargées, Then l’échec est affiché et le chargement se termine', async () => {
    const page = createPage();
    page.programsClient.list = vi
      .fn()
      .mockRejectedValue(new Error('indisponible'));
    await page.loadInitialData();
    expect(page['errorMessage']()).toBe(
      TestBed.inject(KraakI18nService).translate(
        'web.admin.curriculum.feedback.loadFailure',
      ),
    );
    expect(page['loading']()).toBe(false);
  });

  it('Given un programme déjà chargé, When il est sélectionné de nouveau, Then aucune requête supplémentaire n’est envoyée', async () => {
    const page = createPage();
    await page.selectProgram(program.id);
    await page.selectProgram(program.id);
    expect(page.programCoursesClient.list).toHaveBeenCalledOnce();
  });

  it('Given une requête d’affectations échouée puis une sélection plus récente, When les réponses arrivent, Then seule l’erreur courante peut être affichée', async () => {
    const page = createPage();
    let rejectOlder!: (error: Error) => void;
    page.programCoursesClient.list = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectOlder = reject;
          }),
      )
      .mockResolvedValueOnce([secondPlacement])
      .mockRejectedValueOnce(new Error('échec courant'));
    const older = page.selectProgram(program.id);
    await page.selectProgram(secondProgram.id);
    rejectOlder(new Error('échec ancien'));
    await older;
    expect(page['errorMessage']()).toBeNull();
    expect(page['placements']()).toEqual([secondPlacement]);
    await page.loadPlacements(secondProgram.id);
    expect(page['errorMessage']()).toBeTruthy();
    expect(page['placementsLoading']()).toBe(false);
  });

  it('Given un formulaire de cours invalide, When il est soumis, Then les champs sont touchés sans écriture', async () => {
    const page = createPage();
    await page.submitCourse();
    expect(page.courseForm.touched).toBe(true);
    expect(page.coursesClient.create).not.toHaveBeenCalled();
  });

  it('Given deux cours réutilisables, When l’un est modifié, Then seul ce cours est remplacé dans le catalogue', async () => {
    const page = createPage();
    const other = { ...course, id: 'autre-cours' };
    page['courses'].set([course, other]);
    page.openEditCourseForm(course);
    expect(page['isEditingCourse']()).toBe(true);
    await page.submitCourse();
    expect(page.coursesClient.update).toHaveBeenCalledWith(
      course.id,
      expect.objectContaining({ title: course.title }),
    );
    expect(page['courses']()).toEqual([
      { ...course, title: 'Cours modifié' },
      other,
    ]);
    expect(page['showCourseForm']()).toBe(false);
    expect(page['isEditingCourse']()).toBe(false);
  });

  it('Given un enregistrement rejeté, When le cours est soumis, Then le formulaire reste ouvert avec une erreur', async () => {
    const page = createPage();
    page.openEditCourseForm(course);
    page.coursesClient.update = vi
      .fn()
      .mockRejectedValue(new Error('indisponible'));
    await page.submitCourse();
    expect(page['showCourseForm']()).toBe(true);
    expect(page['errorMessage']()).toBeTruthy();
    expect(page['submittingCourse']()).toBe(false);
  });

  it('Given un archivage refusé puis accepté, When le cours est archivé, Then les autres cours restent inchangés', async () => {
    const page = createPage();
    const other = { ...course, id: 'autre-cours' };
    page['courses'].set([course, other]);
    vi.stubGlobal(
      'confirm',
      vi.fn().mockReturnValueOnce(false).mockReturnValue(true),
    );
    await page.archiveCourse(course);
    expect(page.coursesClient.remove).not.toHaveBeenCalled();
    await page.archiveCourse(course);
    expect(page['courses']()).toEqual([
      { ...course, status: 'archived' },
      other,
    ]);
    page.coursesClient.remove = vi
      .fn()
      .mockRejectedValue(new Error('indisponible'));
    await page.archiveCourse(other);
    expect(page['errorMessage']()).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('Given des affectations non prêtes ou aucune sélection, When un cours est affecté, Then aucune écriture ne peut démarrer', async () => {
    const page = createPage();
    page.placementForm.setValue({
      courseId: course.id,
      sortOrder: 0,
      isRequired: true,
    });
    await page.attachCourse();
    page['selectedProgramId'].set(program.id);
    await page.attachCourse();
    expect(page.programCoursesClient.create).not.toHaveBeenCalled();
  });

  it('Given un cours absent du catalogue et un ordre existant, When il est affecté, Then le message générique et le tri sont conservés', async () => {
    const page = createPage();
    page['selectedProgramId'].set(program.id);
    page['placementsReady'].set(true);
    page['placements'].set([{ ...secondPlacement, sortOrder: 4 }]);
    page.placementForm.setValue({
      courseId: course.id,
      sortOrder: 0,
      isRequired: true,
    });
    await page.attachCourse();
    expect(page['placements']().map((item) => item.sortOrder)).toEqual([0, 4]);
    expect(page['successMessage']()).toBe(
      TestBed.inject(KraakI18nService).translate(
        'web.admin.curriculum.feedback.addCourseFallbackSuccess',
      ),
    );
    page.placementForm.setValue({
      courseId: course.id,
      sortOrder: 5,
      isRequired: true,
    });
    page.programCoursesClient.create = vi
      .fn()
      .mockRejectedValue(new Error('indisponible'));
    await page.attachCourse();
    expect(page['errorMessage']()).toBeTruthy();
    expect(page['attachingCourse']()).toBe(false);
  });

  it('Given une affectation orpheline, When son retrait est refusé puis confirmé, Then le message générique est utilisé et les autres affectations restent', async () => {
    const page = createPage();
    page['placements'].set([placement, secondPlacement]);
    vi.stubGlobal(
      'confirm',
      vi.fn().mockReturnValueOnce(false).mockReturnValue(true),
    );
    await page.detachCourse(placement);
    expect(page.programCoursesClient.remove).not.toHaveBeenCalled();
    await page.detachCourse(placement);
    expect(page['placements']()).toEqual([secondPlacement]);
    expect(page['successMessage']()).toBe(
      TestBed.inject(KraakI18nService).translate(
        'web.admin.curriculum.feedback.removeCourseFallbackSuccess',
      ),
    );
    page.programCoursesClient.remove = vi
      .fn()
      .mockRejectedValue(new Error('indisponible'));
    await page.detachCourse(secondPlacement);
    expect(page['errorMessage']()).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('Given des valeurs de statut inconnues, When le catalogue de traduction les laisse intactes, Then leur libellé brut est conservé', () => {
    const page = createPage();
    const translate = vi
      .spyOn(TestBed.inject(KraakI18nService), 'translate')
      .mockImplementation((key) => key);
    expect(page['getPublicationStatusLabel']('inconnu')).toBe('inconnu');
    expect(page['getProgramVisibilityLabel']('inconnue')).toBe('inconnue');
    translate.mockRestore();
  });
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [AdminCurriculumPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        { provide: WebAuthService, useValue: authMock },
      ],
    }).compileComponents();
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given curriculum data, When the page loads, Then the first program and its courses are rendered', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;

    component.programsClient = {
      list: vi.fn().mockResolvedValue([program]),
    };
    component.coursesClient = {
      list: vi.fn().mockResolvedValue([course]),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    component.programCoursesClient = {
      list: vi.fn().mockResolvedValue([placement]),
      create: vi.fn(),
      remove: vi.fn(),
    };

    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(component['loading']()).toBe(false);
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Curriculum');
    expect(text).toContain('Programme Leadership');
    expect(text).toContain('Fondamentaux du leadership');
    expect(component['selectedProgramId']()).toBe('program-1');
  });

  it('Given a valid course form, When submitted, Then the reusable course is created', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;
    const create = vi.fn().mockResolvedValue(course);

    component.coursesClient = {
      list: vi.fn(),
      create,
      update: vi.fn(),
      remove: vi.fn(),
    };

    component.openCreateCourseForm();
    component.courseForm.setValue({
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      description: course.description,
      status: course.status,
    });

    await component.submitCourse();

    expect(create).toHaveBeenCalledWith({
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      description: course.description,
      status: course.status,
    });
    expect(component['courses']()).toContainEqual(course);
  });

  it('Given a selected program and available course, When attached, Then a program-course placement is created', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;
    const create = vi.fn().mockResolvedValue(placement);

    component['programs'].set([program]);
    component['courses'].set([course]);
    component['selectedProgramId'].set(program.id);
    component['placementsReady'].set(true);
    component.programCoursesClient = {
      list: vi.fn(),
      create,
      remove: vi.fn(),
    };

    component.placementForm.setValue({
      courseId: course.id,
      sortOrder: 0,
      isRequired: true,
    });

    await component.attachCourse();

    expect(create).toHaveBeenCalledWith({
      programId: program.id,
      courseId: course.id,
      sortOrder: 0,
      isRequired: true,
    });
    expect(component['placements']()).toContainEqual(placement);
  });

  it('Given an assigned course, When removal is confirmed, Then the placement is deleted without deleting the course', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;
    const remove = vi.fn().mockResolvedValue(undefined);

    component['courses'].set([course]);
    component['placements'].set([placement]);
    component.programCoursesClient = {
      list: vi.fn(),
      create: vi.fn(),
      remove,
    };
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    await component.detachCourse(placement);

    expect(remove).toHaveBeenCalledWith(placement.id);
    expect(component['placements']()).toEqual([]);
    expect(component['courses']()).toContainEqual(course);
  });

  it('Given an assigned course, When it is archived, Then it remains locally available with archived status', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;
    const remove = vi.fn().mockResolvedValue(undefined);

    component['courses'].set([course]);
    component['placements'].set([placement]);
    component.coursesClient = {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove,
    };
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    await component.archiveCourse(course);

    expect(remove).toHaveBeenCalledWith(course.id);
    expect(component['courses']()).toHaveLength(1);
    expect(component['courses']()[0]).toMatchObject({
      id: course.id,
      status: 'archived',
    });
    expect(component['placements']()).toEqual([placement]);
    expect(component['courseById'](course.id)?.status).toBe('archived');
  });

  it('Given rapid program changes, When an older placement request resolves last, Then it cannot overwrite the latest program state', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;

    let resolveFirstProgram!: (value: ProgramCourseDto[]) => void;
    let resolveSecondProgram!: (value: ProgramCourseDto[]) => void;

    const list = vi.fn(({ programId }: { programId?: string } = {}) => {
      return new Promise<ProgramCourseDto[]>((resolve) => {
        if (programId === secondProgram.id) {
          resolveSecondProgram = resolve;
          return;
        }

        resolveFirstProgram = resolve;
      });
    });

    component['programs'].set([program, secondProgram]);
    component['selectedProgramId'].set(program.id);
    component['placements'].set([placement]);
    component['placementsReady'].set(true);
    component.programCoursesClient = {
      list,
      create: vi.fn(),
      remove: vi.fn(),
    };

    const secondProgramLoad = component.selectProgram(secondProgram.id);

    expect(component['selectedProgramId']()).toBe(secondProgram.id);
    expect(component['placements']()).toEqual([]);
    expect(component['placementsReady']()).toBe(false);
    expect(component['placementsLoading']()).toBe(true);

    const firstProgramReload = component.selectProgram(program.id);

    resolveFirstProgram([placement]);
    await firstProgramReload;

    expect(component['selectedProgramId']()).toBe(program.id);
    expect(component['placements']()).toEqual([placement]);
    expect(component['placementsReady']()).toBe(true);
    expect(component['placementsLoading']()).toBe(false);

    resolveSecondProgram([secondPlacement]);
    await secondProgramLoad;

    expect(component['selectedProgramId']()).toBe(program.id);
    expect(component['placements']()).toEqual([placement]);
    expect(component['placementsReady']()).toBe(true);
  });

  it('Given an attachment request in flight, When another program is selected before it resolves, Then the stale placement cannot enter the new program state', async () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;

    let resolveCreate!: (value: ProgramCourseDto) => void;

    const create = vi.fn(
      () =>
        new Promise<ProgramCourseDto>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    component['programs'].set([program, secondProgram]);
    component['courses'].set([course]);
    component['selectedProgramId'].set(program.id);
    component['placements'].set([]);
    component['placementsReady'].set(true);

    component.programCoursesClient = {
      list: vi.fn().mockResolvedValue([]),
      create,
      remove: vi.fn(),
    };

    component.placementForm.setValue({
      courseId: course.id,
      sortOrder: 0,
      isRequired: true,
    });

    const attachment = component.attachCourse();

    await vi.waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1);
    });

    await component.selectProgram(secondProgram.id);

    resolveCreate(placement);
    await attachment;

    expect(component['selectedProgramId']()).toBe(secondProgram.id);
    expect(component['placements']()).toEqual([]);
  });

  it('Given sparse placement ordering, When the placement form resets, Then the next order follows the highest existing value', () => {
    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;

    component['placements'].set([
      placement,
      {
        ...secondPlacement,
        programId: program.id,
        sortOrder: 5,
      },
    ]);

    component['resetPlacementForm']();

    expect(component.placementForm.controls.sortOrder.value).toBe(6);
  });

  it('Given English locale, When Curriculum renders, Then the admin chrome is translated', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(AdminCurriculumPage);
    const component = fixture.componentInstance;

    component['loadInitialData'] = vi.fn().mockResolvedValue(undefined);
    component['loading'].set(false);
    component['programs'].set([]);
    component['courses'].set([]);

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const content = host.textContent ?? '';

    expect(content).toContain('Curriculum');
    expect(content).toContain(
      'Manage the learning catalogue and compose the courses for each programme without duplicating their content.',
    );
    expect(content).toContain('Dashboard');
    expect(content).toContain('New course');

    expect(content).toContain('Programmes');
    expect(content).toContain('Choose a programme');
    expect(content).toContain('No programmes available.');

    expect(content).toContain('Catalogue');
    expect(content).toContain('Courses');
    expect(content).toContain('No courses in the catalogue.');

    expect(content).toContain('Composition');
    expect(content).toContain('Create or select a programme first.');

    expect(component['getPublicationStatusLabel']('draft')).toBe('Draft');
    expect(component['getPublicationStatusLabel']('published')).toBe(
      'Published',
    );
    expect(component['getPublicationStatusLabel']('archived')).toBe('Archived');

    expect(component['getProgramVisibilityLabel']('private')).toBe('Private');
    expect(component['getProgramVisibilityLabel']('participants')).toBe(
      'Participants',
    );
    expect(component['getProgramVisibilityLabel']('public')).toBe('Public');

    expect(
      component['getEditCourseAriaLabel']({
        title: 'Leadership fundamentals',
      }),
    ).toBe('Edit Leadership fundamentals');

    expect(
      component['getArchiveCourseAriaLabel']({
        title: 'Leadership fundamentals',
      }),
    ).toBe('Archive Leadership fundamentals');
  });
});
