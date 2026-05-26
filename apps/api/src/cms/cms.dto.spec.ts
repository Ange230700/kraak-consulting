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
});
