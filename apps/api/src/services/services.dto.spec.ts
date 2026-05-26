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
      errors: ['Le champ title est requis.', 'Le champ sortOrder doit être un entier.'],
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
});
