import {
  validateCreatePartnerPayload,
  validateCreateStatisticPayload,
  validateCreateTeamMemberPayload,
  validateCreateTestimonialPayload,
  validateUpdatePartnerPayload,
  validateUpdateStatisticPayload,
  validateUpdateTeamMemberPayload,
  validateUpdateTestimonialPayload,
} from './cms.dto';

describe('cms.dto validators', () => {
  it('validates create statistic payload', () => {
    const result = validateCreateStatisticPayload({
      label: 'Participants accompagnés',
      value: '250+',
      suffix: null,
      sortOrder: 1,
      status: 'published',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        label: 'Participants accompagnés',
        value: '250+',
        suffix: null,
        sortOrder: 1,
        status: 'published',
      },
    });
  });

  it('rejects invalid create partner payload', () => {
    const result = validateCreatePartnerPayload({
      name: '',
      logoUrl: 'invalid-url',
      sortOrder: -1,
      status: 'invalid',
    });

    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([
        'Le champ name est requis.',
        'Le champ logoUrl est requis et doit être une URL valide.',
        'Le champ sortOrder doit être un entier positif ou nul.',
        'Le champ status est invalide.',
      ]),
    );
  });

  it('validates update testimonial payload', () => {
    const result = validateUpdateTestimonialPayload({
      quote: 'Great program',
      avatarUrl: 'https://example.com/avatar.jpg',
      sortOrder: 3,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        quote: 'Great program',
        avatarUrl: 'https://example.com/avatar.jpg',
        sortOrder: 3,
      },
    });
  });

  it('rejects empty update team member payload', () => {
    const result = validateUpdateTeamMemberPayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('validates create team member payload', () => {
    const result = validateCreateTeamMemberPayload({
      fullName: 'John Doe',
      role: 'Coach',
      bio: null,
      avatarUrl: null,
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      sortOrder: 2,
      status: 'draft',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        fullName: 'John Doe',
        role: 'Coach',
        bio: null,
        avatarUrl: null,
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        sortOrder: 2,
        status: 'draft',
      },
    });
  });

  it('rejects malformed create testimonial payload', () => {
    const result = validateCreateTestimonialPayload({
      quote: ' ',
      authorName: ' ',
      avatarUrl: 'not-a-url',
      sortOrder: 'x',
      status: 'published',
    });

    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([
        'Le champ quote est requis.',
        'Le champ authorName est requis.',
        'Le champ avatarUrl est invalide.',
        'Le champ sortOrder doit être un entier positif ou nul.',
      ]),
    );
  });

  it('validates update statistic payload', () => {
    const result = validateUpdateStatisticPayload({ status: 'archived' });

    expect(result).toEqual({
      valid: true,
      data: { status: 'archived' },
    });
  });

  it('rejects invalid update partner url', () => {
    const result = validateUpdatePartnerPayload({ logoUrl: 'x' });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ logoUrl est requis et doit être une URL valide.'],
    });
  });

  it('rejects invalid request body shape for all CMS validators', () => {
    expect(validateCreateStatisticPayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateUpdateStatisticPayload('invalid')).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateCreatePartnerPayload(undefined)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateUpdatePartnerPayload(42)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateCreateTestimonialPayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateUpdateTestimonialPayload('invalid')).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateCreateTeamMemberPayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
    expect(validateUpdateTeamMemberPayload('invalid')).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('rejects malformed create statistic payload', () => {
    const result = validateCreateStatisticPayload({
      label: ' ',
      value: ' ',
      sortOrder: -1,
      status: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ label est requis.',
        'Le champ value est requis.',
        'Le champ sortOrder doit être un entier positif ou nul.',
        'Le champ status est invalide.',
      ],
    });
  });

  it('rejects empty update statistic payload', () => {
    const result = validateUpdateStatisticPayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });
  });

  it('validates create partner payload with nullable website', () => {
    const result = validateCreatePartnerPayload({
      name: 'KRAAK Partner',
      logoUrl: 'https://cdn.kraak.test/logo.png',
      websiteUrl: null,
      sortOrder: 3,
      status: 'draft',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        name: 'KRAAK Partner',
        logoUrl: 'https://cdn.kraak.test/logo.png',
        websiteUrl: null,
        sortOrder: 3,
        status: 'draft',
      },
    });
  });

  it('rejects invalid update partner payload fields', () => {
    const result = validateUpdatePartnerPayload({
      name: ' ',
      websiteUrl: 'not-a-url',
      sortOrder: -3,
      status: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ name est requis.',
        'Le champ websiteUrl est invalide.',
        'Le champ sortOrder doit être un entier positif ou nul.',
        'Le champ status est invalide.',
      ],
    });
  });

  it('validates create testimonial payload with nullable profile fields', () => {
    const result = validateCreateTestimonialPayload({
      quote: 'Programme transformateur',
      authorName: 'Awa',
      authorRole: null,
      company: null,
      avatarUrl: null,
      sortOrder: 0,
      status: 'published',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        quote: 'Programme transformateur',
        authorName: 'Awa',
        authorRole: null,
        company: null,
        avatarUrl: null,
        sortOrder: 0,
        status: 'published',
      },
    });
  });

  it('rejects empty and malformed update testimonial payload', () => {
    expect(validateUpdateTestimonialPayload({})).toEqual({
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    });

    const result = validateUpdateTestimonialPayload({
      quote: ' ',
      authorName: ' ',
      avatarUrl: 'not-a-url',
      sortOrder: -1,
      status: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ quote est requis.',
        'Le champ authorName est requis.',
        'Le champ avatarUrl est invalide.',
        'Le champ sortOrder doit être un entier positif ou nul.',
        'Le champ status est invalide.',
      ],
    });
  });

  it('rejects malformed create team member payload', () => {
    const result = validateCreateTeamMemberPayload({
      fullName: ' ',
      role: ' ',
      avatarUrl: 'not-a-url',
      linkedinUrl: 'not-a-url',
      sortOrder: -1,
      status: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ fullName est requis.',
        'Le champ role est requis.',
        'Le champ avatarUrl est invalide.',
        'Le champ linkedinUrl est invalide.',
        'Le champ sortOrder doit être un entier positif ou nul.',
        'Le champ status est invalide.',
      ],
    });
  });

  it('validates update team member payload nullable fields', () => {
    const result = validateUpdateTeamMemberPayload({
      bio: null,
      avatarUrl: null,
      linkedinUrl: null,
      sortOrder: 10,
      status: 'archived',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        bio: null,
        avatarUrl: null,
        linkedinUrl: null,
        sortOrder: 10,
        status: 'archived',
      },
    });
  });

  it('rejects malformed update team member payload', () => {
    const result = validateUpdateTeamMemberPayload({
      fullName: ' ',
      role: ' ',
      avatarUrl: 'bad-url',
      linkedinUrl: 'bad-url',
      sortOrder: -1,
      status: 'invalid',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ fullName est requis.',
        'Le champ role est requis.',
        'Le champ avatarUrl est invalide.',
        'Le champ linkedinUrl est invalide.',
        'Le champ sortOrder doit être un entier positif ou nul.',
        'Le champ status est invalide.',
      ],
    });
  });
});
