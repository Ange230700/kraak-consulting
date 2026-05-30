import {
  validateCreateProgramPayload,
  validateCreateProgramFeaturePayload,
  validateMarkSessionProgressPayload,
  validateUpdateProgramFeaturePayload,
  validateUpdateProgramPayload,
} from './programs.dto';

describe('Programs DTO validation', () => {
  it('Given un payload de création valide, When validateCreateProgramPayload est appelé, Then le DTO normalisé est renvoyé', () => {
    const result = validateCreateProgramPayload({
      slug: ' programme-test ',
      title: ' Programme test ',
      summary: ' Résumé ',
      description: ' Description ',
      status: 'published',
      visibility: 'public',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        slug: 'programme-test',
        title: 'Programme test',
        summary: 'Résumé',
        description: 'Description',
        status: 'published',
        visibility: 'public',
      },
    });
  });

  it('Given un payload de création invalide, When validateCreateProgramPayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateCreateProgramPayload({
      slug: 'Slug Invalide',
      title: '',
      summary: '',
      description: '',
      status: 'invalid',
      visibility: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ slug est invalide.',
        'Le champ title est requis.',
        'Le champ summary est requis.',
        'Le champ description est requis.',
        'Le champ status est invalide.',
        'Le champ visibility est invalide.',
      ],
    });
  });

  it('Given un body non objet, When validateCreateProgramPayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateCreateProgramPayload(null);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un payload de mise à jour valide, When validateUpdateProgramPayload est appelé, Then le DTO partiel est renvoyé', () => {
    const result = validateUpdateProgramPayload({
      slug: ' programme-updated ',
      title: ' Nouveau titre ',
      summary: ' Nouveau résumé ',
      description: ' Nouvelle description ',
      status: 'draft',
      visibility: 'participants',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        slug: 'programme-updated',
        title: 'Nouveau titre',
        summary: 'Nouveau résumé',
        description: 'Nouvelle description',
        status: 'draft',
        visibility: 'participants',
      },
    });
  });

  it('Given un payload de mise à jour vide, When validateUpdateProgramPayload est appelé, Then une erreur métier est renvoyée', () => {
    const result = validateUpdateProgramPayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('Given un payload de mise à jour invalide, When validateUpdateProgramPayload est appelé, Then les erreurs de validation sont renvoyées', () => {
    const result = validateUpdateProgramPayload({
      slug: 'slug invalide',
      status: 'invalid',
      visibility: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ slug est invalide.',
        'Le champ status est invalide.',
        'Le champ visibility est invalide.',
      ],
    });
  });

  it('Given un body non objet, When validateUpdateProgramPayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateUpdateProgramPayload([]);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un payload feature valide, When validateCreateProgramFeaturePayload est appelé, Then le DTO normalisé est renvoyé', () => {
    const result = validateCreateProgramFeaturePayload({
      title: ' Session mentorée ',
      sortOrder: 2,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Session mentorée',
        sortOrder: 2,
      },
    });
  });

  it('Given un payload feature invalide, When validateUpdateProgramFeaturePayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateUpdateProgramFeaturePayload({
      title: '',
      sortOrder: 1.5,
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ title est requis.',
        'Le champ sortOrder doit être un entier.',
      ],
    });
  });

  it('Given un payload feature création invalide, When validateCreateProgramFeaturePayload est appelé, Then les erreurs sont renvoyées', () => {
    const result = validateCreateProgramFeaturePayload({
      title: ' ',
      sortOrder: 2.5,
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ title est requis.',
        'Le champ sortOrder doit être un entier.',
      ],
    });
  });

  it('Given un payload feature création sans title, When validateCreateProgramFeaturePayload est appelé, Then une erreur title requis est renvoyée', () => {
    const result = validateCreateProgramFeaturePayload({
      sortOrder: 1,
    });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ title est requis.'],
    });
  });

  it('Given un payload feature update vide, When validateUpdateProgramFeaturePayload est appelé, Then une erreur métier est renvoyée', () => {
    const result = validateUpdateProgramFeaturePayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('Given un body non objet feature, When les validateurs feature sont appelés, Then une erreur corps invalide est renvoyée', () => {
    expect(validateCreateProgramFeaturePayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });

    expect(validateUpdateProgramFeaturePayload('invalid')).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  // Given un payload valide
  // When la validation du marquage progression est exécutée
  // Then le DTO normalisé est renvoyé
  it('Given un payload valide, When validateMarkSessionProgressPayload est appelé, Then le payload normalisé est renvoyé', () => {
    const result = validateMarkSessionProgressPayload({
      sessionId: ' session-1 ',
      completed: true,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        sessionId: 'session-1',
        completed: true,
      },
    });
  });

  // Given un payload invalide
  // When la validation est exécutée
  // Then les erreurs explicites sont renvoyées
  it('Given un payload invalide, When validateMarkSessionProgressPayload est appelé, Then les erreurs sont renvoyées', () => {
    const result = validateMarkSessionProgressPayload({
      sessionId: '',
      completed: 'yes',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ sessionId est requis.',
        'Le champ completed doit être un booléen.',
      ],
    });
  });

  it('Given un body non objet, When validateMarkSessionProgressPayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateMarkSessionProgressPayload('invalid');

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un slug vide en mise à jour, When validateUpdateProgramPayload est appelé, Then une erreur slug requis est renvoyée', () => {
    const result = validateUpdateProgramPayload({
      slug: '   ',
    });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ slug est requis.'],
    });
  });
});
