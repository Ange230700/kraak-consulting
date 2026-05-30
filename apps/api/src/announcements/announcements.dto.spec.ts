import {
  validateCreateAnnouncementPayload,
  validateUpdateAnnouncementPayload,
} from './announcements.dto';

describe('Announcements DTO validation', () => {
  it('Given un corps non objet, When validateCreateAnnouncementPayload est appelé, Then une erreur de corps invalide est renvoyée', () => {
    const result = validateCreateAnnouncementPayload(null);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un payload de création valide, When validateCreateAnnouncementPayload est appelé, Then le DTO normalisé est renvoyé', () => {
    const result = validateCreateAnnouncementPayload({
      title: ' Mise à jour ',
      body: ' Un contenu important ',
      priority: 'high',
      audienceType: 'cohort',
      programId: ' program-1 ',
      cohortId: ' cohort-1 ',
      status: 'published',
      publishedAt: '2026-05-26T12:00:00Z',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Mise à jour',
        body: 'Un contenu important',
        priority: 'high',
        audienceType: 'cohort',
        programId: 'program-1',
        cohortId: 'cohort-1',
        status: 'published',
        publishedAt: '2026-05-26T12:00:00.000Z',
      },
    });
  });

  it('Given un payload création sans audienceType, When validateCreateAnnouncementPayload est appelé, Then la validation retourne un DTO valide sans scope', () => {
    const result = validateCreateAnnouncementPayload({
      title: 'Annonce générale',
      body: 'Contenu général',
      priority: 'normal',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Annonce générale',
        body: 'Contenu général',
        priority: 'normal',
      },
    });
  });

  it('Given un payload de création invalide, When validateCreateAnnouncementPayload est appelé, Then les erreurs de périmètre sont renvoyées', () => {
    const result = validateCreateAnnouncementPayload({
      title: 'Annonce',
      body: 'Contenu',
      audienceType: 'program',
      cohortId: 'cohort-1',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ programId est requis lorsque audienceType vaut program.',
        'Le champ cohortId doit être absent lorsque audienceType vaut program.',
      ],
    });
  });

  it('Given un payload all_participants avec scope explicite, When validateCreateAnnouncementPayload est appelé, Then les erreurs de scope sont renvoyées', () => {
    const result = validateCreateAnnouncementPayload({
      title: 'Annonce',
      body: 'Contenu',
      audienceType: 'all_participants',
      programId: 'program-1',
      cohortId: 'cohort-1',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ programId doit être absent lorsque audienceType vaut all_participants.',
        'Le champ cohortId doit être absent lorsque audienceType vaut all_participants.',
      ],
    });
  });

  it('Given un payload de création avec enums invalides, When validateCreateAnnouncementPayload est appelé, Then les erreurs enum sont renvoyées', () => {
    const result = validateCreateAnnouncementPayload({
      title: 'Annonce',
      body: 'Contenu',
      audienceType: 'all_participants',
      priority: 'urgent',
      status: 'live',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ priority est invalide.',
        'Le champ status est invalide.',
      ],
    });
  });

  it('Given un payload de mise à jour invalide, When validateUpdateAnnouncementPayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateUpdateAnnouncementPayload({
      audienceType: 'cohort',
      programId: null,
      publishedAt: 'invalid-date',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ publishedAt est invalide.',
        'Le champ programId est requis lorsque audienceType vaut cohort.',
        'Le champ cohortId est requis lorsque audienceType vaut cohort.',
      ],
    });
  });

  it('Given un payload de mise à jour vide, When validateUpdateAnnouncementPayload est appelé, Then une erreur métier est renvoyée', () => {
    const result = validateUpdateAnnouncementPayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('Given un payload de mise à jour valide avec audience program, When validateUpdateAnnouncementPayload est appelé, Then le DTO partiel normalisé est renvoyé', () => {
    const result = validateUpdateAnnouncementPayload({
      audienceType: 'program',
      programId: ' program-1 ',
      cohortId: null,
      publishedAt: null,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        audienceType: 'program',
        programId: 'program-1',
        cohortId: null,
        publishedAt: null,
      },
    });
  });

  it('Given un corps non objet en mise à jour, When validateUpdateAnnouncementPayload est appelé, Then une erreur de corps invalide est renvoyée', () => {
    const result = validateUpdateAnnouncementPayload(null);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un programId sans audienceType, When validateUpdateAnnouncementPayload est appelé, Then une erreur de cohérence est renvoyée', () => {
    const result = validateUpdateAnnouncementPayload({
      programId: 'program-1',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ audienceType est requis lorsque programId ou cohortId sont fournis.',
      ],
    });
  });
});
