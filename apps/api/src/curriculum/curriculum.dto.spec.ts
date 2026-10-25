import {
  validateCreateChapterLessonPayload,
  validateCreateChapterPayload,
  validateCreateCourseModulePayload,
  validateCreateCoursePayload,
  validateCreateLearningModulePayload,
  validateCreateLessonPayload,
  validateCreateProgramCoursePayload,
  validateUpdateChapterLessonPayload,
  validateUpdateChapterPayload,
  validateUpdateCourseModulePayload,
  validateUpdateCoursePayload,
  validateUpdateLearningModulePayload,
  validateUpdateLessonPayload,
  validateUpdateProgramCoursePayload,
} from './curriculum.dto';
import * as validators from './curriculum.dto';

describe.each([
  [
    'Course',
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
    {
      programId: 'program-1',
      courseId: 'course-1',
      sortOrder: 0,
      isRequired: false,
    },
  ],
  [
    'CourseModule',
    {
      courseId: 'course-1',
      learningModuleId: 'module-1',
      sortOrder: 0,
      isRequired: false,
    },
  ],
  [
    'ChapterLesson',
    {
      chapterId: 'chapter-1',
      lessonId: 'lesson-1',
      sortOrder: 0,
      isRequired: false,
    },
  ],
] as const)('Given le contrat %s', (entity, payload) => {
  const create = validators[`validateCreate${entity}Payload`];
  const update = validators[`validateUpdate${entity}Payload`];

  it.each([null, [], 'texte', 42])(
    'When le corps n’est pas un objet (%p), Then création et mise à jour sont rejetées',
    (body) => {
      expect(create(body)).toMatchObject({
        valid: false,
        errors: expect.any(Array),
      });
      expect(update(body)).toMatchObject({
        valid: false,
        errors: expect.any(Array),
      });
    },
  );

  it('When le corps est vide, Then création et mise à jour sont rejetées', () => {
    expect(create({})).toMatchObject({ valid: false });
    expect(update({})).toMatchObject({ valid: false });
  });

  it('When tous les champs sont valides, Then le contenu normalisé est accepté', () => {
    expect(create(payload)).toMatchObject({ valid: true });
    expect(update(payload)).toMatchObject({ valid: true });
  });

  it.each(['', null, -1, 0.5])(
    'When chaque champ reçoit une valeur invalide (%p), Then elle est rejetée',
    (invalid) => {
      for (const field of Object.keys(payload)) {
        expect(create({ ...payload, [field]: invalid })).toMatchObject({
          valid: false,
        });
        expect(update({ [field]: invalid })).toMatchObject({ valid: false });
      }
    },
  );
});

describe('Curriculum DTO validation', () => {
  it('Given un slug non compatible avec une URL, When un cours est modifié, Then la validation le rejette', () => {
    expect(validateUpdateCoursePayload({ slug: 'Invalid Slug' })).toMatchObject(
      {
        valid: false,
        errors: [{ key: 'validation.invalidField', params: { field: 'slug' } }],
      },
    );
  });
  it('Given un slug non compatible avec une URL, When un cours est créé, Then la validation le rejette', () => {
    expect(
      validateCreateCoursePayload({
        slug: 'Invalid Slug',
        title: 'Leadership',
        summary: 'Résumé',
        description: 'Description',
        status: 'draft',
      }),
    ).toMatchObject({ valid: false });
  });
  it('Given des entités pédagogiques valides, When les validateurs create sont appelés, Then les payloads sont normalisés', () => {
    expect(
      validateCreateCoursePayload({
        slug: ' leadership-foundations ',
        title: ' Leadership Foundations ',
        summary: ' Résumé ',
        description: ' Description ',
        status: 'published',
      }),
    ).toEqual({
      valid: true,
      data: {
        slug: 'leadership-foundations',
        title: 'Leadership Foundations',
        summary: 'Résumé',
        description: 'Description',
        status: 'published',
      },
    });

    expect(
      validateCreateLearningModulePayload({
        slug: ' self-leadership ',
        title: ' Self Leadership ',
        summary: ' Résumé ',
        description: ' Description ',
        status: 'draft',
      }).valid,
    ).toBe(true);

    expect(
      validateCreateLessonPayload({
        slug: ' leading-yourself ',
        title: ' Leading Yourself ',
        summary: ' Résumé ',
        description: ' Description ',
        status: 'draft',
      }).valid,
    ).toBe(true);

    expect(
      validateCreateChapterPayload({
        learningModuleId: ' module-1 ',
        slug: ' introduction ',
        title: ' Introduction ',
        summary: ' Résumé ',
        status: 'published',
        sortOrder: 0,
      }),
    ).toEqual({
      valid: true,
      data: {
        learningModuleId: 'module-1',
        slug: 'introduction',
        title: 'Introduction',
        summary: 'Résumé',
        status: 'published',
        sortOrder: 0,
      },
    });
  });

  it('Given des placements valides, When les validateurs create sont appelés, Then les relations et ordres sont normalisés', () => {
    expect(
      validateCreateProgramCoursePayload({
        programId: ' program-1 ',
        courseId: ' course-1 ',
        sortOrder: 0,
        isRequired: true,
      }),
    ).toEqual({
      valid: true,
      data: {
        programId: 'program-1',
        courseId: 'course-1',
        sortOrder: 0,
        isRequired: true,
      },
    });

    expect(
      validateCreateCourseModulePayload({
        courseId: 'course-1',
        learningModuleId: 'module-1',
        sortOrder: 1,
        isRequired: false,
      }).valid,
    ).toBe(true);

    expect(
      validateCreateChapterLessonPayload({
        chapterId: 'chapter-1',
        lessonId: 'lesson-1',
        sortOrder: 2,
        isRequired: true,
      }).valid,
    ).toBe(true);
  });

  it('Given des valeurs invalides, When les validateurs sont appelés, Then les erreurs métier sont explicites', () => {
    expect(
      validateCreateCoursePayload({
        slug: 'Slug Invalide',
        title: '',
        summary: '',
        description: '',
        status: 'deleted',
      }),
    ).toEqual({
      valid: false,
      errors: [
        { key: 'validation.invalidField', params: { field: 'slug' } },
        { key: 'validation.requiredField', params: { field: 'title' } },
        { key: 'validation.requiredField', params: { field: 'summary' } },
        { key: 'validation.requiredField', params: { field: 'description' } },
        { key: 'validation.invalidField', params: { field: 'status' } },
      ],
    });

    expect(
      validateCreateChapterPayload({
        learningModuleId: '',
        slug: 'chapter',
        title: 'Chapter',
        summary: 'Summary',
        status: 'draft',
        sortOrder: -1,
      }).valid,
    ).toBe(false);

    expect(
      validateCreateProgramCoursePayload({
        programId: 'program-1',
        courseId: 'course-1',
        sortOrder: 0.5,
        isRequired: 'yes',
      }),
    ).toEqual({
      valid: false,
      errors: [
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.booleanField', params: { field: 'isRequired' } },
      ],
    });
  });

  it('Given des mises à jour partielles valides, When les validateurs update sont appelés, Then chaque famille est acceptée', () => {
    expect(validateUpdateCoursePayload({ title: ' Nouveau titre ' })).toEqual({
      valid: true,
      data: { title: 'Nouveau titre' },
    });

    expect(
      validateUpdateLearningModulePayload({ status: 'archived' }).valid,
    ).toBe(true);

    expect(validateUpdateLessonPayload({ summary: ' Nouveau ' }).valid).toBe(
      true,
    );

    expect(validateUpdateChapterPayload({ sortOrder: 3 }).valid).toBe(true);

    expect(
      validateUpdateProgramCoursePayload({ isRequired: false }).valid,
    ).toBe(true);

    expect(validateUpdateCourseModulePayload({ sortOrder: 4 }).valid).toBe(
      true,
    );

    expect(validateUpdateChapterLessonPayload({ sortOrder: 5 }).valid).toBe(
      true,
    );
  });

  it('Given un payload update vide ou un body invalide, When la validation est exécutée, Then le payload est rejeté', () => {
    expect(validateUpdateCoursePayload({})).toEqual({
      valid: false,
      errors: [{ key: 'validation.updateRequiresField' }],
    });

    expect(validateCreateCoursePayload(null)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
  });
});
