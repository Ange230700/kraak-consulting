import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';

describe('CurriculumController', () => {
  let controller: CurriculumController;

  it.each([
    [
      'Course',
      'Courses',
      {
        slug: 'leadership',
        title: 'Leadership',
        summary: 'Résumé',
        description: 'Description',
        status: 'draft',
      },
    ],
    [
      'LearningModule',
      'LearningModules',
      {
        slug: 'leadership',
        title: 'Leadership',
        summary: 'Résumé',
        description: 'Description',
        status: 'draft',
      },
    ],
    [
      'Lesson',
      'Lessons',
      {
        slug: 'leadership',
        title: 'Leadership',
        summary: 'Résumé',
        description: 'Description',
        status: 'draft',
      },
    ],
    [
      'Chapter',
      'Chapters',
      {
        slug: 'leadership',
        title: 'Leadership',
        summary: 'Résumé',
        status: 'draft',
        learningModuleId: 'module-1',
        sortOrder: 0,
      },
    ],
    [
      'ProgramCourse',
      'ProgramCourses',
      {
        programId: 'program-1',
        courseId: 'course-1',
        sortOrder: 0,
        isRequired: false,
      },
    ],
    [
      'CourseModule',
      'CourseModules',
      {
        courseId: 'course-1',
        learningModuleId: 'module-1',
        sortOrder: 0,
        isRequired: false,
      },
    ],
    [
      'ChapterLesson',
      'ChapterLessons',
      {
        chapterId: 'chapter-1',
        lessonId: 'lesson-1',
        sortOrder: 0,
        isRequired: false,
      },
    ],
  ] as const)(
    'Given une entité %s, When un administrateur la gère, Then les résultats métier sont exposés',
    async (entity, collection, payload) => {
      const result = { id: 'entity-1' };
      curriculumService[`list${collection}`].mockResolvedValue([result]);
      curriculumService[`create${entity}`].mockResolvedValue(result);
      curriculumService[`update${entity}`].mockResolvedValue(result);
      const header = 'Bearer access-token';
      const listArgs = [
        'Chapter',
        'ProgramCourse',
        'CourseModule',
        'ChapterLesson',
      ].includes(entity)
        ? ['parent-1', header]
        : [header];
      const list = controller[`list${collection}`] as (
        ...args: string[]
      ) => Promise<unknown>;
      await expect(list.apply(controller, listArgs)).resolves.toEqual([result]);
      await expect(
        controller[`create${entity}`](payload, header),
      ).resolves.toEqual(result);
      await expect(
        controller[`update${entity}`]('entity-1', payload, header),
      ).resolves.toEqual(result);
      await expect(
        controller[`create${entity}`](null, header),
      ).rejects.toBeInstanceOf(BadRequestException);
      const operation = [
        'ProgramCourse',
        'CourseModule',
        'ChapterLesson',
      ].includes(entity)
        ? `delete${entity}`
        : `archive${entity}`;
      await expect(
        (
          controller as unknown as Record<
            string,
            (id: string, authorization: string) => Promise<void>
          >
        )[operation]!('entity-1', header),
      ).resolves.toBeUndefined();
      expect(curriculumService[`update${entity}`]).toHaveBeenCalledWith(
        'entity-1',
        payload,
      );
    },
  );

  const curriculumService = {
    listCourses: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    archiveCourse: jest.fn(),
    listLearningModules: jest.fn(),
    createLearningModule: jest.fn(),
    updateLearningModule: jest.fn(),
    archiveLearningModule: jest.fn(),
    listChapters: jest.fn(),
    createChapter: jest.fn(),
    updateChapter: jest.fn(),
    archiveChapter: jest.fn(),
    listLessons: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    archiveLesson: jest.fn(),
    listProgramCourses: jest.fn(),
    createProgramCourse: jest.fn(),
    updateProgramCourse: jest.fn(),
    deleteProgramCourse: jest.fn(),
    listCourseModules: jest.fn(),
    createCourseModule: jest.fn(),
    updateCourseModule: jest.fn(),
    deleteCourseModule: jest.fn(),
    listChapterLessons: jest.fn(),
    createChapterLesson: jest.fn(),
    updateChapterLesson: jest.fn(),
    deleteChapterLesson: jest.fn(),
  };

  const authService = {
    getSession: jest.fn().mockResolvedValue({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurriculumController],
      providers: [
        { provide: CurriculumService, useValue: curriculumService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get(CurriculumController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Given un admin, When listCourses est appelé, Then le service est utilisé', async () => {
    curriculumService.listCourses.mockResolvedValue([]);

    await expect(
      controller.listCourses('Bearer access-token'),
    ).resolves.toEqual([]);

    expect(authService.getSession).toHaveBeenCalledWith('access-token');
    expect(curriculumService.listCourses).toHaveBeenCalledTimes(1);
  });

  it('Given un payload course valide, When createCourse est appelé, Then le payload normalisé est transmis', async () => {
    curriculumService.createCourse.mockResolvedValue({
      id: 'course-1',
    });

    await controller.createCourse(
      {
        slug: ' leadership ',
        title: ' Leadership ',
        summary: ' Summary ',
        description: ' Description ',
        status: 'draft',
      },
      'Bearer access-token',
    );

    expect(curriculumService.createCourse).toHaveBeenCalledWith({
      slug: 'leadership',
      title: 'Leadership',
      summary: 'Summary',
      description: 'Description',
      status: 'draft',
    });
  });

  it('Given un payload invalide, When createCourse est appelé, Then BadRequestException est renvoyée', async () => {
    await expect(
      controller.createCourse(
        {
          slug: 'Invalid Slug',
          title: '',
          summary: '',
          description: '',
          status: 'invalid',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(curriculumService.createCourse).not.toHaveBeenCalled();
  });

  it('Given des filtres de placement, When les listes sont appelées, Then les identifiants parents sont propagés', async () => {
    curriculumService.listProgramCourses.mockResolvedValue([]);
    curriculumService.listCourseModules.mockResolvedValue([]);
    curriculumService.listChapterLessons.mockResolvedValue([]);

    await controller.listProgramCourses('program-1', 'Bearer access-token');
    await controller.listCourseModules('course-1', 'Bearer access-token');
    await controller.listChapterLessons('chapter-1', 'Bearer access-token');

    expect(curriculumService.listProgramCourses).toHaveBeenCalledWith(
      'program-1',
    );
    expect(curriculumService.listCourseModules).toHaveBeenCalledWith(
      'course-1',
    );
    expect(curriculumService.listChapterLessons).toHaveBeenCalledWith(
      'chapter-1',
    );
  });

  it('Given un placement valide, When createProgramCourse est appelé, Then la relation normalisée est transmise', async () => {
    curriculumService.createProgramCourse.mockResolvedValue({
      id: 'placement-1',
    });

    await controller.createProgramCourse(
      {
        programId: ' program-1 ',
        courseId: ' course-1 ',
        sortOrder: 0,
        isRequired: true,
      },
      'Bearer access-token',
    );

    expect(curriculumService.createProgramCourse).toHaveBeenCalledWith({
      programId: 'program-1',
      courseId: 'course-1',
      sortOrder: 0,
      isRequired: true,
    });
  });

  it('Given des suppressions admin, When archive/delete sont appelés, Then la bonne sémantique service est utilisée', async () => {
    curriculumService.archiveLesson.mockResolvedValue(undefined);
    curriculumService.deleteChapterLesson.mockResolvedValue(undefined);

    await controller.archiveLesson('lesson-1', 'Bearer access-token');
    await controller.deleteChapterLesson(
      'chapter-lesson-1',
      'Bearer access-token',
    );

    expect(curriculumService.archiveLesson).toHaveBeenCalledWith('lesson-1');
    expect(curriculumService.deleteChapterLesson).toHaveBeenCalledWith(
      'chapter-lesson-1',
    );
  });
});
