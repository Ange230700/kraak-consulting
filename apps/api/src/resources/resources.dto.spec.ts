import {
  validateCreateResourcePayload,
  validateUpdateResourcePayload,
} from './resources.dto';

describe('Resources DTO validation', () => {
  it('Given un payload de création valide, When validateCreateResourcePayload est appelé, Then le DTO normalisé est renvoyé', () => {
    const result = validateCreateResourcePayload({
      title: ' Guide RH ',
      description: ' Description ',
      resourceType: 'document',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: ' https://example.com/guide ',
      filePath: ' /srv/resources/file.pdf ',
      status: 'published',
      publishedAt: '2026-05-25T10:00:00Z',
      programId: ' program-1 ',
      cohortId: ' cohort-1 ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Guide RH',
        description: 'Description',
        resourceType: 'document',
        resourceTheme: 'training',
        resourceAudience: 'all',
        url: 'https://example.com/guide',
        filePath: '/srv/resources/file.pdf',
        status: 'published',
        publishedAt: '2026-05-25T10:00:00.000Z',
        programId: 'program-1',
        cohortId: 'cohort-1',
      },
    });
  });

  it('Given un payload de création invalide, When validateCreateResourcePayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateCreateResourcePayload({
      title: '',
      resourceType: 'invalid',
      resourceTheme: 'invalid',
      resourceAudience: 'invalid',
      status: 'invalid',
      publishedAt: 'date-invalide',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { key: 'validation.requiredField', params: { field: 'title' } },
        { key: 'validation.invalidField', params: { field: 'resourceType' } },
        { key: 'validation.invalidField', params: { field: 'resourceTheme' } },
        {
          key: 'validation.invalidField',
          params: { field: 'resourceAudience' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
        { key: 'validation.invalidField', params: { field: 'publishedAt' } },
      ],
    });
  });

  it('Given un body non objet, When validateCreateResourcePayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateCreateResourcePayload(null);

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
  });

  it('Given un payload de mise à jour valide, When validateUpdateResourcePayload est appelé, Then le DTO partiel normalisé est renvoyé', () => {
    const result = validateUpdateResourcePayload({
      title: ' Nouveau titre ',
      description: ' ',
      resourceType: 'video',
      resourceTheme: 'career',
      resourceAudience: 'organizations',
      url: ' ',
      filePath: null,
      status: 'draft',
      publishedAt: null,
      programId: ' program-2 ',
      cohortId: ' cohort-2 ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Nouveau titre',
        description: null,
        resourceType: 'video',
        resourceTheme: 'career',
        resourceAudience: 'organizations',
        url: null,
        filePath: null,
        status: 'draft',
        publishedAt: null,
        programId: 'program-2',
        cohortId: 'cohort-2',
      },
    });
  });

  it('Given un payload de mise à jour vide, When validateUpdateResourcePayload est appelé, Then une erreur métier est renvoyée', () => {
    const result = validateUpdateResourcePayload({});

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'validation.updateRequiresField' }],
    });
  });

  it('Given un payload de mise à jour invalide, When validateUpdateResourcePayload est appelé, Then les erreurs de validation sont renvoyées', () => {
    const result = validateUpdateResourcePayload({
      title: '',
      resourceType: 'invalid',
      resourceTheme: 'invalid',
      resourceAudience: 'invalid',
      status: 'invalid',
      publishedAt: 'date-invalide',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { key: 'validation.requiredField', params: { field: 'title' } },
        { key: 'validation.invalidField', params: { field: 'resourceType' } },
        { key: 'validation.invalidField', params: { field: 'resourceTheme' } },
        {
          key: 'validation.invalidField',
          params: { field: 'resourceAudience' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
        { key: 'validation.invalidField', params: { field: 'publishedAt' } },
      ],
    });
  });

  it('Given un body non objet, When validateUpdateResourcePayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateUpdateResourcePayload('invalid');

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
  });
});
