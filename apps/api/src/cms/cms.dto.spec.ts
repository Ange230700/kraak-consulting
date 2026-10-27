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
  it.each([
    [' ', null],
    [' personnes ', 'personnes'],
  ])(
    'Given le suffixe %p, When la statistique est normalisée, Then le suffixe devient %p',
    (suffix, expected) => {
      expect(
        validateCreateStatisticPayload({
          label: 'Participants',
          value: '250',
          suffix,
          sortOrder: 0,
          status: 'published',
        }),
      ).toMatchObject({ valid: true, data: { suffix: expected } });
    },
  );

  it('Given une valeur de statistique vide, When la mise à jour est validée, Then le message de champ requis est conservé', () => {
    expect(validateUpdateStatisticPayload({ value: ' ' })).toEqual({
      valid: false,
      errors: [{ key: 'validation.requiredField', params: { field: 'value' } }],
    });
  });

  it('Given un partenaire avec une nouvelle URL, When la mise à jour est validée, Then l’URL normalisée est acceptée', () => {
    expect(
      validateUpdatePartnerPayload({
        websiteUrl: ' https://example.com ',
      }),
    ).toEqual({
      valid: true,
      data: { websiteUrl: 'https://example.com' },
    });
  });

  it.each([
    {
      validate: validateCreateStatisticPayload,
      body: { label: '', value: '', sortOrder: -1, status: 'invalid' },
      fields: ['label', 'value'],
    },
    {
      validate: validateCreateTestimonialPayload,
      body: {
        quote: '',
        authorName: '',
        avatarUrl: 'invalid-url',
        sortOrder: -1,
        status: 'invalid',
      },
      fields: ['quote', 'authorName'],
    },
  ])(
    'Given un contenu incomplet ($fields), When sa création est validée, Then les erreurs métier précèdent les erreurs de publication',
    ({ validate, body, fields }) => {
      const errors = fields.map((field) => ({
        key: 'validation.requiredField',
        params: { field },
      }));
      if ('avatarUrl' in body) {
        errors.push({
          key: 'validation.invalidField',
          params: { field: 'avatarUrl' },
        });
      }
      errors.push(
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
      );
      expect(validate(body)).toEqual({ valid: false, errors });
    },
  );

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
        { key: 'validation.requiredField', params: { field: 'name' } },
        {
          key: 'validation.requiredValidUrlField',
          params: { field: 'logoUrl' },
        },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
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
      errors: [{ key: 'validation.updateRequiresField' }],
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
        { key: 'validation.requiredField', params: { field: 'quote' } },
        { key: 'validation.requiredField', params: { field: 'authorName' } },
        { key: 'validation.invalidField', params: { field: 'avatarUrl' } },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
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

  it('Given sortOrder as a numeric string When create statistic is validated Then sortOrder is parsed as an integer', () => {
    const result = validateCreateStatisticPayload({
      label: 'Apprenants',
      value: '120',
      suffix: null,
      sortOrder: '7',
      status: 'published',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        label: 'Apprenants',
        value: '120',
        suffix: null,
        sortOrder: 7,
        status: 'published',
      },
    });
  });

  it('rejects invalid update partner url', () => {
    const result = validateUpdatePartnerPayload({ logoUrl: 'x' });

    expect(result).toEqual({
      valid: false,
      errors: [
        {
          key: 'validation.requiredValidUrlField',
          params: { field: 'logoUrl' },
        },
      ],
    });
  });

  it('Given un logoUrl vide pour une mise à jour partner, When validateUpdatePartnerPayload est appelé, Then une erreur required URL est renvoyée', () => {
    const result = validateUpdatePartnerPayload({ logoUrl: '   ' });

    expect(result).toEqual({
      valid: false,
      errors: [
        {
          key: 'validation.requiredValidUrlField',
          params: { field: 'logoUrl' },
        },
      ],
    });
  });

  it('Given un payload update partner vide, When validateUpdatePartnerPayload est appelé, Then une erreur de payload vide est renvoyée', () => {
    const result = validateUpdatePartnerPayload({});

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'validation.updateRequiresField' }],
    });
  });

  it('rejects invalid request body shape for all CMS validators', () => {
    expect(validateCreateStatisticPayload(null)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateUpdateStatisticPayload('invalid')).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateCreatePartnerPayload(undefined)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateUpdatePartnerPayload(42)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateCreateTestimonialPayload(null)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateUpdateTestimonialPayload('invalid')).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateCreateTeamMemberPayload(null)).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
    });
    expect(validateUpdateTeamMemberPayload('invalid')).toEqual({
      valid: false,
      errors: [{ key: 'validation.invalidBody' }],
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
        { key: 'validation.requiredField', params: { field: 'label' } },
        { key: 'validation.requiredField', params: { field: 'value' } },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
      ],
    });
  });

  it('Given un sortOrder négatif en chaîne, When validateCreateStatisticPayload est appelé, Then sortOrder est rejeté comme entier positif ou nul', () => {
    const result = validateCreateStatisticPayload({
      label: 'Participants',
      value: '250',
      sortOrder: '-1',
      status: 'published',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
      ],
    });
  });

  it('rejects empty update statistic payload', () => {
    const result = validateUpdateStatisticPayload({});

    expect(result).toEqual({
      valid: false,
      errors: [{ key: 'validation.updateRequiresField' }],
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

  it('Given un websiteUrl invalide à la création partner, When validateCreatePartnerPayload est appelé, Then websiteUrl est signalé invalide', () => {
    const result = validateCreatePartnerPayload({
      name: 'KRAAK Partner',
      logoUrl: 'https://cdn.kraak.test/logo.png',
      websiteUrl: 'not-a-url',
      sortOrder: 1,
      status: 'published',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { key: 'validation.invalidField', params: { field: 'websiteUrl' } },
      ],
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
        { key: 'validation.requiredField', params: { field: 'name' } },
        { key: 'validation.invalidField', params: { field: 'websiteUrl' } },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
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
      errors: [{ key: 'validation.updateRequiresField' }],
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
        { key: 'validation.requiredField', params: { field: 'quote' } },
        { key: 'validation.requiredField', params: { field: 'authorName' } },
        { key: 'validation.invalidField', params: { field: 'avatarUrl' } },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
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
        { key: 'validation.requiredField', params: { field: 'fullName' } },
        { key: 'validation.requiredField', params: { field: 'role' } },
        { key: 'validation.invalidField', params: { field: 'avatarUrl' } },
        { key: 'validation.invalidField', params: { field: 'linkedinUrl' } },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
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
        { key: 'validation.requiredField', params: { field: 'fullName' } },
        { key: 'validation.requiredField', params: { field: 'role' } },
        { key: 'validation.invalidField', params: { field: 'avatarUrl' } },
        { key: 'validation.invalidField', params: { field: 'linkedinUrl' } },
        {
          key: 'validation.nonNegativeIntegerField',
          params: { field: 'sortOrder' },
        },
        { key: 'validation.invalidField', params: { field: 'status' } },
      ],
    });
  });
});
