import {
  validateCreateServiceDetailPayload,
  validateCreateServicePayload,
  validateUpdateServiceDetailPayload,
  validateUpdateServicePayload,
} from './services.dto';

describe('Services DTO validation', () => {
  it('Given un payload de création service valide, When validateCreateServicePayload est appelé, Then le DTO normalisé est renvoyé', () => {
    const result = validateCreateServicePayload({
      title: ' Accompagnement ',
      description: ' Description du service ',
      icon: ' briefcase ',
      sortOrder: 2,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Accompagnement',
        description: 'Description du service',
        icon: 'briefcase',
        sortOrder: 2,
      },
    });
  });

  it('Given un payload de mise à jour service invalide, When validateUpdateServicePayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateUpdateServicePayload({
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

  it('Given un payload de création détail valide, When validateCreateServiceDetailPayload est appelé, Then le DTO normalisé est renvoyé', () => {
    const result = validateCreateServiceDetailPayload({
      title: ' Audit ',
      description: ' Cartographie des besoins ',
      sortOrder: 1,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Audit',
        description: 'Cartographie des besoins',
        sortOrder: 1,
      },
    });
  });

  it('Given un payload de mise à jour détail vide, When validateUpdateServiceDetailPayload est appelé, Then une erreur métier est renvoyée', () => {
    const result = validateUpdateServiceDetailPayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('Given un body non objet, When validateCreateServicePayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateCreateServicePayload(null);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un body non objet service update, When validateUpdateServicePayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateUpdateServicePayload(null);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un payload de création service invalide, When validateCreateServicePayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateCreateServicePayload({
      title: ' ',
      description: ' ',
      sortOrder: 1.5,
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ title est requis.',
        'Le champ description est requis.',
        'Le champ sortOrder doit être un entier.',
      ],
    });
  });

  it('Given un payload de mise à jour service valide, When validateUpdateServicePayload est appelé, Then les champs nullable sont normalisés', () => {
    const result = validateUpdateServicePayload({
      description: ' Description mise à jour ',
      icon: ' ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        description: 'Description mise à jour',
        icon: null,
      },
    });
  });

  it('Given un payload de mise à jour service vide, When validateUpdateServicePayload est appelé, Then une erreur métier est renvoyée', () => {
    const result = validateUpdateServicePayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('Given un body non objet détail, When validateUpdateServiceDetailPayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateUpdateServiceDetailPayload('invalid');

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un payload détail invalide, When validateCreateServiceDetailPayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateCreateServiceDetailPayload({
      title: '',
      description: '',
      sortOrder: 2.2,
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ title est requis.',
        'Le champ description est requis.',
        'Le champ sortOrder doit être un entier.',
      ],
    });
  });

  it('Given un body non objet détail création, When validateCreateServiceDetailPayload est appelé, Then une erreur corps invalide est renvoyée', () => {
    const result = validateCreateServiceDetailPayload(null);

    expect(result).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un payload détail update invalide, When validateUpdateServiceDetailPayload est appelé, Then les erreurs attendues sont renvoyées', () => {
    const result = validateUpdateServiceDetailPayload({
      title: ' ',
      description: ' ',
      sortOrder: 1.8,
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ title est requis.',
        'Le champ description est requis.',
        'Le champ sortOrder doit être un entier.',
      ],
    });
  });
});
