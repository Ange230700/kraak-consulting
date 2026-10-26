import { Test, type TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CurriculumService reusable entities', () => {
  let service: CurriculumService;

  const mockSupabaseService = {
    getClient: jest.fn(),
  };

  const timestamps = {
    created_at: '2026-08-28T10:00:00Z',
    updated_at: '2026-08-28T10:00:00Z',
  };

  const courseRow = {
    id: 'course-1',
    slug: 'leadership-foundations',
    title: 'Leadership Foundations',
    summary: 'Summary',
    description: 'Description',
    status: 'published' as const,
    ...timestamps,
  };

  const programCourseRow = {
    id: 'program-course-1',
    program_id: 'program-1',
    course_id: 'course-1',
    sort_order: 0,
    is_required: true,
    ...timestamps,
  };

  const courseModuleRow = {
    id: 'course-module-1',
    course_id: 'course-1',
    learning_module_id: 'module-1',
    sort_order: 1,
    is_required: true,
    ...timestamps,
  };

  const chapterLessonRow = {
    id: 'chapter-lesson-1',
    chapter_id: 'chapter-1',
    lesson_id: 'lesson-1',
    sort_order: 2,
    is_required: false,
    ...timestamps,
  };

  const chapterRow = {
    id: 'chapter-1',
    learning_module_id: 'module-1',
    slug: 'introduction',
    title: 'Introduction',
    summary: 'Summary',
    status: 'published' as const,
    sort_order: 0,
    ...timestamps,
  };

  function createListQuery(result: { data: unknown; error: Error | null }) {
    const query = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      then: (
        resolve: (value: { data: unknown; error: Error | null }) => unknown,
      ) => Promise.resolve(result).then(resolve),
    };

    return {
      from: jest.fn().mockReturnValue(query),
      ...query,
    };
  }

  function createMutationQuery(result: { data: unknown; error: Error | null }) {
    const query = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(result),
    };

    return {
      from: jest.fn().mockReturnValue(query),
      ...query,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurriculumService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(CurriculumService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['Course', 'Courses', courseRow],
    ['LearningModule', 'LearningModules', courseRow],
    ['Chapter', 'Chapters', chapterRow],
    ['Lesson', 'Lessons', courseRow],
    ['ProgramCourse', 'ProgramCourses', programCourseRow],
    ['CourseModule', 'CourseModules', courseModuleRow],
    ['ChapterLesson', 'ChapterLessons', chapterLessonRow],
  ] as const)('Given une entité %s', (entity, collection, row) => {
    const payload = {
      slug: 'leadership',
      title: 'Leadership',
      summary: 'Résumé',
      description: 'Description',
      status: 'published' as const,
      learningModuleId: 'module-1',
      programId: 'program-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
      lessonId: 'lesson-1',
      sortOrder: 0,
      isRequired: false,
    };

    it('When la liste contient une ligne, Then son identité et ses dates sont exposées', async () => {
      mockSupabaseService.getClient.mockReturnValue(
        createListQuery({ data: [row], error: null }),
      );
      await expect(service[`list${collection}`]('parent-1')).resolves.toEqual([
        expect.objectContaining({
          id: row.id,
          createdAt: timestamps.created_at,
          updatedAt: timestamps.updated_at,
        }),
      ]);
    });

    it('When la base ne renvoie aucune ligne, Then une liste vide est renvoyée', async () => {
      mockSupabaseService.getClient.mockReturnValue(
        createListQuery({ data: null, error: null }),
      );
      await expect(service[`list${collection}`]()).resolves.toEqual([]);
    });

    it('When la lecture échoue, Then une erreur serveur est exposée', async () => {
      mockSupabaseService.getClient.mockReturnValue(
        createListQuery({ data: null, error: new Error('indisponible') }),
      );
      await expect(service[`list${collection}`]()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('When une création réussit, Then la nouvelle entité est renvoyée', async () => {
      mockSupabaseService.getClient.mockReturnValue(
        createMutationQuery({ data: row, error: null }),
      );
      await expect(service[`create${entity}`](payload)).resolves.toMatchObject({
        id: row.id,
      });
    });

    it.each([
      { data: null, error: null },
      { data: row, error: new Error('indisponible') },
    ])(
      'When une création échoue ($error), Then une erreur serveur est exposée',
      async (result) => {
        mockSupabaseService.getClient.mockReturnValue(
          createMutationQuery(result),
        );
        await expect(
          service[`create${entity}`](payload),
        ).rejects.toBeInstanceOf(InternalServerErrorException);
      },
    );

    it.each([payload, {}])(
      'When une mise à jour réussit, Then l’entité actualisée est renvoyée',
      async (update) => {
        mockSupabaseService.getClient.mockReturnValue(
          createMutationQuery({ data: row, error: null }),
        );
        await expect(
          service[`update${entity}`]('entity-1', update),
        ).resolves.toMatchObject({ id: row.id });
      },
    );

    it.each([
      { data: null, error: null },
      { data: row, error: new Error('indisponible') },
    ])(
      'When la mise à jour ne trouve pas de résultat ($error), Then une erreur introuvable est exposée',
      async (result) => {
        mockSupabaseService.getClient.mockReturnValue(
          createMutationQuery(result),
        );
        await expect(
          service[`update${entity}`]('entity-1', payload),
        ).rejects.toBeInstanceOf(NotFoundException);
      },
    );
  });

  it.each([
    'archiveCourse',
    'archiveLearningModule',
    'archiveChapter',
    'archiveLesson',
    'deleteProgramCourse',
    'deleteCourseModule',
    'deleteChapterLesson',
  ] as const)(
    'Given une entité existante, When %s réussit, Then aucun contenu n’est renvoyé',
    async (operation) => {
      mockSupabaseService.getClient.mockReturnValue(
        createMutationQuery({ data: { id: 'entity-1' }, error: null }),
      );
      await expect(service[operation]('entity-1')).resolves.toBeUndefined();
    },
  );

  it.each([
    { data: null, error: null },
    { data: { id: 'entity-1' }, error: new Error('indisponible') },
  ])(
    'Given une entité absente, When suppression ou archivage échoue, Then une erreur introuvable est exposée',
    async (result) => {
      mockSupabaseService.getClient.mockReturnValue(
        createMutationQuery(result),
      );
      await expect(service.archiveCourse('entity-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(
        service.deleteProgramCourse('entity-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  describe('Given un curriculum publié', () => {
    function curriculumClient(
      overrides: Record<string, { data: unknown; error: Error | null }> = {},
    ) {
      const rows: Record<string, unknown[]> = {
        program_course: [
          programCourseRow,
          { ...programCourseRow, course_id: 'absent' },
          { ...programCourseRow, course_id: 'empty-course' },
        ],
        course: [courseRow, { ...courseRow, id: 'empty-course' }],
        course_module: [
          courseModuleRow,
          { ...courseModuleRow, learning_module_id: 'absent' },
          { ...courseModuleRow, learning_module_id: 'empty-module' },
        ],
        learning_module: [
          { ...courseRow, id: 'module-1' },
          { ...courseRow, id: 'empty-module' },
        ],
        chapter: [chapterRow, { ...chapterRow, id: 'empty-chapter' }],
        chapter_lesson: [
          chapterLessonRow,
          { ...chapterLessonRow, lesson_id: 'absent' },
        ],
        lesson: [{ ...courseRow, id: 'lesson-1' }],
      };
      const queries = Object.fromEntries(
        Object.entries(rows).map(([table, data]) => [
          table,
          createListQuery(overrides[table] ?? { data, error: null }),
        ]),
      );
      return {
        from: jest.fn((table: string) => queries[table]),
        queries,
      };
    }

    it('When un cours est placé plusieurs fois, Then sa lecture est unique et chaque placement conserve sa hiérarchie', async () => {
      const client = curriculumClient({
        program_course: {
          data: [
            programCourseRow,
            { ...programCourseRow, id: 'program-course-2', sort_order: 1 },
          ],
          error: null,
        },
      });
      mockSupabaseService.getClient.mockReturnValue(client);

      const result = await service.getPublishedProgramCurriculum('program-1');

      expect(client.queries['course']!.in).toHaveBeenCalledWith('id', [
        'course-1',
      ]);
      expect(result.courses.map(({ placement }) => placement.id)).toEqual([
        'program-course-1',
        'program-course-2',
      ]);
      expect(result.courses[0]!.modules).toEqual(result.courses[1]!.modules);
      expect(result.courses[0]!.modules[0]!.chapters[0]!.lessons).toHaveLength(
        1,
      );
    });

    it('When certaines références ne sont plus publiées, Then seules les entités disponibles sont renvoyées', async () => {
      mockSupabaseService.getClient.mockReturnValue(curriculumClient());
      const result = await service.getPublishedProgramCurriculum('program-1');
      expect(result.courses).toHaveLength(2);
      expect(result.courses[1]!.modules).toEqual([]);
      expect(result.courses[0]!.modules).toHaveLength(2);
      expect(result.courses[0]!.modules[1]!.chapters).toEqual([]);
      expect(result.courses[0]!.modules[0]!.chapters[1]!.lessons).toEqual([]);
      expect(result.courses[0]!.modules[0]!.chapters[0]!.lessons).toHaveLength(
        1,
      );
    });

    it.each([
      'program_course',
      'course',
      'course_module',
      'learning_module',
      'chapter',
      'chapter_lesson',
      'lesson',
    ])(
      'When la lecture de %s échoue, Then aucune hiérarchie partielle n’est exposée',
      async (table) => {
        mockSupabaseService.getClient.mockReturnValue(
          curriculumClient({
            [table]: { data: null, error: new Error('indisponible') },
          }),
        );
        await expect(
          service.getPublishedProgramCurriculum('program-1'),
        ).rejects.toBeInstanceOf(InternalServerErrorException);
      },
    );

    it.each([
      'program_course',
      'course',
      'course_module',
      'learning_module',
      'chapter',
      'chapter_lesson',
      'lesson',
    ])(
      'When %s ne contient aucune donnée, Then la hiérarchie conserve seulement les éléments accessibles',
      async (table) => {
        mockSupabaseService.getClient.mockReturnValue(
          curriculumClient({
            [table]: { data: null, error: null },
          }),
        );
        const result = await service.getPublishedProgramCurriculum('program-1');
        let descendants: unknown;
        if (table === 'program_course' || table === 'course') {
          descendants = result.courses;
        } else if (table === 'course_module' || table === 'learning_module') {
          descendants = result.courses[0]!.modules;
        } else if (table === 'chapter') {
          descendants = result.courses[0]!.modules[0]!.chapters;
        } else {
          descendants = result.courses[0]!.modules[0]!.chapters[0]!.lessons;
        }
        expect(descendants).toEqual([]);
      },
    );
  });

  it('Given des cours existants, When listCourses est appelé, Then les DTO camelCase sont renvoyés', async () => {
    mockSupabaseService.getClient.mockReturnValue(
      createListQuery({ data: [courseRow], error: null }),
    );

    await expect(service.listCourses()).resolves.toEqual([
      {
        id: 'course-1',
        slug: 'leadership-foundations',
        title: 'Leadership Foundations',
        summary: 'Summary',
        description: 'Description',
        status: 'published',
        createdAt: timestamps.created_at,
        updatedAt: timestamps.updated_at,
      },
    ]);
  });

  it('Given un cours valide, When createCourse est appelé, Then la ligne est insérée et mappée', async () => {
    const client = createMutationQuery({
      data: courseRow,
      error: null,
    });

    mockSupabaseService.getClient.mockReturnValue(client);

    await expect(
      service.createCourse({
        slug: 'leadership-foundations',
        title: 'Leadership Foundations',
        summary: 'Summary',
        description: 'Description',
        status: 'published',
      }),
    ).resolves.toMatchObject({
      id: 'course-1',
      slug: 'leadership-foundations',
    });

    expect(client.insert).toHaveBeenCalledWith({
      slug: 'leadership-foundations',
      title: 'Leadership Foundations',
      summary: 'Summary',
      description: 'Description',
      status: 'published',
    });
  });

  it('Given une mise à jour de cours, When updateCourse est appelé, Then seuls les champs fournis sont persistés', async () => {
    const client = createMutationQuery({
      data: { ...courseRow, title: 'Updated' },
      error: null,
    });

    mockSupabaseService.getClient.mockReturnValue(client);

    await service.updateCourse('course-1', {
      title: 'Updated',
      status: 'draft',
    });

    expect(client.update).toHaveBeenCalledWith({
      title: 'Updated',
      status: 'draft',
    });
    expect(client.eq).toHaveBeenCalledWith('id', 'course-1');
  });

  it('Given un cours existant, When archiveCourse est appelé, Then le contenu est archivé sans suppression physique', async () => {
    const client = createMutationQuery({
      data: { id: 'course-1' },
      error: null,
    });

    mockSupabaseService.getClient.mockReturnValue(client);

    await expect(service.archiveCourse('course-1')).resolves.toBeUndefined();

    expect(client.update).toHaveBeenCalledWith({ status: 'archived' });
    expect(client.eq).toHaveBeenCalledWith('id', 'course-1');
  });

  it('Given un module, une leçon et un chapitre valides, When les create correspondants sont appelés, Then les mappings SQL sont corrects', async () => {
    const moduleClient = createMutationQuery({
      data: {
        ...courseRow,
        id: 'module-1',
        slug: 'self-leadership',
      },
      error: null,
    });

    const lessonClient = createMutationQuery({
      data: {
        ...courseRow,
        id: 'lesson-1',
        slug: 'leading-yourself',
      },
      error: null,
    });

    const chapterClient = createMutationQuery({
      data: chapterRow,
      error: null,
    });

    mockSupabaseService.getClient
      .mockReturnValueOnce(moduleClient)
      .mockReturnValueOnce(lessonClient)
      .mockReturnValueOnce(chapterClient);

    await service.createLearningModule({
      slug: 'self-leadership',
      title: 'Self Leadership',
      summary: 'Summary',
      description: 'Description',
      status: 'draft',
    });

    await service.createLesson({
      slug: 'leading-yourself',
      title: 'Leading Yourself',
      summary: 'Summary',
      description: 'Description',
      status: 'draft',
    });

    await service.createChapter({
      learningModuleId: 'module-1',
      slug: 'introduction',
      title: 'Introduction',
      summary: 'Summary',
      status: 'published',
      sortOrder: 0,
    });

    expect(chapterClient.insert).toHaveBeenCalledWith({
      learning_module_id: 'module-1',
      slug: 'introduction',
      title: 'Introduction',
      summary: 'Summary',
      status: 'published',
      sort_order: 0,
    });
  });

  it('Given un filtre module, When listChapters est appelé, Then la requête filtre learning_module_id', async () => {
    const client = createListQuery({
      data: [chapterRow],
      error: null,
    });

    mockSupabaseService.getClient.mockReturnValue(client);

    await expect(service.listChapters('module-1')).resolves.toHaveLength(1);

    expect(client.eq).toHaveBeenCalledWith('learning_module_id', 'module-1');
  });

  describe('Participant curriculum aggregate', () => {
    it('Given un curriculum publié, When getPublishedProgramCurriculum est appelé, Then la hiérarchie ordonnée est agrégée', async () => {
      const programCourseQuery = createListQuery({
        data: [programCourseRow],
        error: null,
      });
      const courseQuery = createListQuery({
        data: [courseRow],
        error: null,
      });
      const courseModuleQuery = createListQuery({
        data: [courseModuleRow],
        error: null,
      });
      const learningModuleQuery = createListQuery({
        data: [
          {
            ...courseRow,
            id: 'module-1',
            slug: 'self-leadership',
            title: 'Self Leadership',
          },
        ],
        error: null,
      });
      const chapterQuery = createListQuery({
        data: [chapterRow],
        error: null,
      });
      const chapterLessonQuery = createListQuery({
        data: [chapterLessonRow],
        error: null,
      });
      const lessonQuery = createListQuery({
        data: [
          {
            ...courseRow,
            id: 'lesson-1',
            slug: 'leading-yourself',
            title: 'Leading Yourself',
          },
        ],
        error: null,
      });

      const client = {
        from: jest.fn((table: string) => {
          switch (table) {
            case 'program_course':
              return programCourseQuery;
            case 'course':
              return courseQuery;
            case 'course_module':
              return courseModuleQuery;
            case 'learning_module':
              return learningModuleQuery;
            case 'chapter':
              return chapterQuery;
            case 'chapter_lesson':
              return chapterLessonQuery;
            case 'lesson':
              return lessonQuery;
            default:
              throw new Error(`Unexpected table ${table}`);
          }
        }),
      };

      mockSupabaseService.getClient.mockReturnValue(client);

      await expect(
        service.getPublishedProgramCurriculum('program-1'),
      ).resolves.toMatchObject({
        courses: [
          {
            placement: {
              id: 'program-course-1',
              programId: 'program-1',
              courseId: 'course-1',
            },
            course: {
              id: 'course-1',
              status: 'published',
            },
            modules: [
              {
                placement: {
                  id: 'course-module-1',
                  learningModuleId: 'module-1',
                },
                learningModule: {
                  id: 'module-1',
                  status: 'published',
                },
                chapters: [
                  {
                    chapter: {
                      id: 'chapter-1',
                      status: 'published',
                    },
                    lessons: [
                      {
                        placement: {
                          id: 'chapter-lesson-1',
                          lessonId: 'lesson-1',
                        },
                        lesson: {
                          id: 'lesson-1',
                          status: 'published',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(courseQuery.eq).toHaveBeenCalledWith('status', 'published');
      expect(learningModuleQuery.eq).toHaveBeenCalledWith(
        'status',
        'published',
      );
      expect(chapterQuery.eq).toHaveBeenCalledWith('status', 'published');
      expect(lessonQuery.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('Given aucun cours placé, When getPublishedProgramCurriculum est appelé, Then un curriculum vide est renvoyé sans requêtes inutiles', async () => {
      const programCourseQuery = createListQuery({
        data: [],
        error: null,
      });
      const client = {
        from: jest.fn().mockReturnValue(programCourseQuery),
      };

      mockSupabaseService.getClient.mockReturnValue(client);

      await expect(
        service.getPublishedProgramCurriculum('program-1'),
      ).resolves.toEqual({
        courses: [],
      });

      expect(client.from).toHaveBeenCalledTimes(1);
      expect(client.from).toHaveBeenCalledWith('program_course');
    });

    it('Given une erreur curriculum, When la hiérarchie est chargée, Then une erreur interne explicite est renvoyée', async () => {
      const programCourseQuery = createListQuery({
        data: null,
        error: new Error('database unavailable'),
      });

      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue(programCourseQuery),
      });

      await expect(
        service.getPublishedProgramCurriculum('program-1'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('Curriculum placements', () => {
    it('Given des placements existants, When les listes sont chargées, Then les DTO camelCase et les filtres sont appliqués', async () => {
      const programCourseClient = createListQuery({
        data: [programCourseRow],
        error: null,
      });
      const courseModuleClient = createListQuery({
        data: [courseModuleRow],
        error: null,
      });
      const chapterLessonClient = createListQuery({
        data: [chapterLessonRow],
        error: null,
      });

      mockSupabaseService.getClient
        .mockReturnValueOnce(programCourseClient)
        .mockReturnValueOnce(courseModuleClient)
        .mockReturnValueOnce(chapterLessonClient);

      await expect(service.listProgramCourses('program-1')).resolves.toEqual([
        {
          id: 'program-course-1',
          programId: 'program-1',
          courseId: 'course-1',
          sortOrder: 0,
          isRequired: true,
          createdAt: timestamps.created_at,
          updatedAt: timestamps.updated_at,
        },
      ]);

      await expect(service.listCourseModules('course-1')).resolves.toHaveLength(
        1,
      );
      await expect(
        service.listChapterLessons('chapter-1'),
      ).resolves.toHaveLength(1);

      expect(programCourseClient.eq).toHaveBeenCalledWith(
        'program_id',
        'program-1',
      );
      expect(courseModuleClient.eq).toHaveBeenCalledWith(
        'course_id',
        'course-1',
      );
      expect(chapterLessonClient.eq).toHaveBeenCalledWith(
        'chapter_id',
        'chapter-1',
      );
    });

    it('Given des placements valides, When ils sont créés, Then les colonnes SQL attendues sont insérées', async () => {
      const programCourseClient = createMutationQuery({
        data: programCourseRow,
        error: null,
      });
      const courseModuleClient = createMutationQuery({
        data: courseModuleRow,
        error: null,
      });
      const chapterLessonClient = createMutationQuery({
        data: chapterLessonRow,
        error: null,
      });

      mockSupabaseService.getClient
        .mockReturnValueOnce(programCourseClient)
        .mockReturnValueOnce(courseModuleClient)
        .mockReturnValueOnce(chapterLessonClient);

      await service.createProgramCourse({
        programId: 'program-1',
        courseId: 'course-1',
        sortOrder: 0,
        isRequired: true,
      });

      await service.createCourseModule({
        courseId: 'course-1',
        learningModuleId: 'module-1',
        sortOrder: 1,
        isRequired: true,
      });

      await service.createChapterLesson({
        chapterId: 'chapter-1',
        lessonId: 'lesson-1',
        sortOrder: 2,
        isRequired: false,
      });

      expect(programCourseClient.insert).toHaveBeenCalledWith({
        program_id: 'program-1',
        course_id: 'course-1',
        sort_order: 0,
        is_required: true,
      });
      expect(courseModuleClient.insert).toHaveBeenCalledWith({
        course_id: 'course-1',
        learning_module_id: 'module-1',
        sort_order: 1,
        is_required: true,
      });
      expect(chapterLessonClient.insert).toHaveBeenCalledWith({
        chapter_id: 'chapter-1',
        lesson_id: 'lesson-1',
        sort_order: 2,
        is_required: false,
      });
    });

    it('Given une mise à jour de placement, When updateProgramCourse est appelé, Then seuls les champs fournis sont propagés', async () => {
      const client = createMutationQuery({
        data: {
          ...programCourseRow,
          sort_order: 4,
          is_required: false,
        },
        error: null,
      });

      mockSupabaseService.getClient.mockReturnValue(client);

      await service.updateProgramCourse('program-course-1', {
        sortOrder: 4,
        isRequired: false,
      });

      expect(client.update).toHaveBeenCalledWith({
        sort_order: 4,
        is_required: false,
      });
    });

    it('Given trois placements existants, When ils sont supprimés, Then une suppression physique est exécutée', async () => {
      const first = createMutationQuery({
        data: { id: 'program-course-1' },
        error: null,
      });
      const second = createMutationQuery({
        data: { id: 'course-module-1' },
        error: null,
      });
      const third = createMutationQuery({
        data: { id: 'chapter-lesson-1' },
        error: null,
      });

      mockSupabaseService.getClient
        .mockReturnValueOnce(first)
        .mockReturnValueOnce(second)
        .mockReturnValueOnce(third);

      await service.deleteProgramCourse('program-course-1');
      await service.deleteCourseModule('course-module-1');
      await service.deleteChapterLesson('chapter-lesson-1');

      expect(first.delete).toHaveBeenCalledTimes(1);
      expect(second.delete).toHaveBeenCalledTimes(1);
      expect(third.delete).toHaveBeenCalledTimes(1);
    });

    it('Given une erreur de lecture ou un placement absent, When les opérations sont exécutées, Then les exceptions adaptées sont renvoyées', async () => {
      mockSupabaseService.getClient
        .mockReturnValueOnce(
          createListQuery({
            data: null,
            error: new Error('database unavailable'),
          }),
        )
        .mockReturnValueOnce(
          createMutationQuery({
            data: null,
            error: new Error('not found'),
          }),
        );

      await expect(service.listCourseModules()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      await expect(
        service.deleteChapterLesson('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('Given une erreur de lecture, When listCourses est appelé, Then une erreur interne explicite est renvoyée', async () => {
    mockSupabaseService.getClient.mockReturnValue(
      createListQuery({
        data: null,
        error: new Error('database unavailable'),
      }),
    );

    await expect(service.listCourses()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('Given une entité absente, When update ou archive est appelé, Then NotFoundException est renvoyée', async () => {
    mockSupabaseService.getClient
      .mockReturnValueOnce(
        createMutationQuery({
          data: null,
          error: new Error('not found'),
        }),
      )
      .mockReturnValueOnce(
        createMutationQuery({
          data: null,
          error: new Error('not found'),
        }),
      );

    await expect(
      service.updateCourse('missing', { title: 'Updated' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(service.archiveLesson('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
