import {
  validateContactForm,
  validateSupportStatusUpdatePayload,
} from './support.dto';

describe('validateContactForm', () => {
  // Given un corps de requête valide
  // When la validation est appliquée
  // Then les champs sont normalisés et la catégorie par défaut vaut other
  it('Given un corps valide, When la validation est appliquée, Then les données sont normalisées et la catégorie par défaut vaut other', () => {
    const result = validateContactForm({
      name: '  Alice Dupont  ',
      email: 'alice@exemple.com',
      subject: '  Demande de renseignements  ',
      message: '  Bonjour, je souhaite en savoir plus sur vos services.  ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Demande de renseignements',
        message: 'Bonjour, je souhaite en savoir plus sur vos services.',
        category: 'other',
      },
    });
  });

  it('Given un corps valide avec catégorie support explicite, When la validation est appliquée, Then la catégorie est conservée', () => {
    const result = validateContactForm({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'Demande de renseignements',
      message: 'Bonjour, je souhaite en savoir plus sur vos services.',
      category: 'immigration',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        name: 'Alice Dupont',
        email: 'alice@exemple.com',
        subject: 'Demande de renseignements',
        message: 'Bonjour, je souhaite en savoir plus sur vos services.',
        category: 'immigration',
      },
    });
  });

  // Given un payload invalide
  // When la validation est appliquée
  // Then les erreurs utilisateur sont explicites
  it('Given un payload invalide, When la validation est appliquée, Then des erreurs explicites sont renvoyées', () => {
    const result = validateContactForm({
      name: 'A',
      email: 'not-an-email',
      subject: ' ',
      message: 'Court',
      category: 'finance',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { key: 'support.nameTooShort' },
        { key: 'validation.invalidEmail' },
        { key: 'support.subjectRequired' },
        { key: 'support.messageTooShort' },
        { key: 'support.categoryInvalid' },
      ],
    });
  });

  // Given un corps non objet
  // When la validation est appliquée
  // Then une erreur de requête invalide est renvoyée
  it('Given un corps invalide, When la validation est appliquée, Then la requête est rejetée proprement', () => {
    expect(validateContactForm(null)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
  });

  it('Given des champs obligatoires vides, When la validation est appliquée, Then les erreurs requis sont renvoyées', () => {
    const result = validateContactForm({
      name: ' ',
      email: 'alice@exemple.com',
      subject: ' ',
      message: ' ',
      category: 'other',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { key: 'support.nameRequired' },
        { key: 'support.subjectRequired' },
        { key: 'support.messageRequired' },
      ],
    });
  });

  it("Given un objet trop court (2 caractères), When la validation est appliquée, Then l'erreur de longueur minimale de l'objet est renvoyée", () => {
    const result = validateContactForm({
      name: 'Alice Dupont',
      email: 'alice@exemple.com',
      subject: 'OK',
      message: 'Bonjour, je souhaite en savoir plus.',
      category: 'other',
    });

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'support.subjectTooShort' }],
    });
  });

  it('Given des champs dépassant les longueurs max, When la validation est appliquée, Then les erreurs de dépassement sont renvoyées', () => {
    const result = validateContactForm({
      name: 'A'.repeat(81),
      email: 'alice@exemple.com',
      subject: 'S'.repeat(121),
      message: 'M'.repeat(2001),
      category: 'other',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { key: 'support.nameTooLong' },
        { key: 'support.subjectTooLong' },
        { key: 'support.messageTooLong' },
      ],
    });
  });
});

describe('validateSupportStatusUpdatePayload', () => {
  it('Given un payload de statut valide, When la validation est appliquée, Then le statut normalisé est renvoyé', () => {
    const result = validateSupportStatusUpdatePayload({
      status: ' in_progress ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        status: 'in_progress',
      },
    });
  });

  it('Given un statut invalide, When la validation est appliquée, Then une erreur explicite est renvoyée', () => {
    const result = validateSupportStatusUpdatePayload({ status: 'pending' });

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'support.statusInvalid' }],
    });
  });

  it('Given un corps non objet, When la validation de statut est appliquée, Then une erreur de requête invalide est renvoyée', () => {
    expect(validateSupportStatusUpdatePayload([])).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
  });
});
