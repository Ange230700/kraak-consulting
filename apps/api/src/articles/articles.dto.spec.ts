import {
  validateCreateCategoryPayload,
  validateCreateTagPayload,
  validateCreateArticlePayload,
  validateUpdateCategoryPayload,
  validateUpdateTagPayload,
  validateUpdateArticlePayload,
} from './articles.dto';

describe('Articles DTO validation', () => {
  it('Given un payload création valide, When validateCreateArticlePayload est appelé, Then le payload normalisé est renvoyé', () => {
    const result = validateCreateArticlePayload({
      slug: '  nouvel-article  ',
      title: '  Un titre  ',
      excerpt: '  Un résumé suffisamment long pour le test.  ',
      content: '  <p>Contenu</p>  ',
      status: 'draft',
      coverImageUrl: 'https://cdn.kraak.test/cover.jpg',
      seoTitle: '  SEO title  ',
      seoDescription: '  SEO description  ',
      publishedAt: null,
      authorId: ' author-1 ',
      categoryIds: [' category-1 ', 'category-2'],
      tagIds: [' tag-1 '],
    });

    expect(result).toEqual({
      valid: true,
      data: {
        slug: 'nouvel-article',
        title: 'Un titre',
        excerpt: 'Un résumé suffisamment long pour le test.',
        content: '<p>Contenu</p>',
        status: 'draft',
        coverImageUrl: 'https://cdn.kraak.test/cover.jpg',
        seoTitle: 'SEO title',
        seoDescription: 'SEO description',
        publishedAt: null,
        authorId: 'author-1',
        categoryIds: ['category-1', 'category-2'],
        tagIds: ['tag-1'],
      },
    });
  });

  it('Given un payload création invalide, When validateCreateArticlePayload est appelé, Then les erreurs explicites sont renvoyées', () => {
    const result = validateCreateArticlePayload({
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      status: 'invalid',
      authorId: '',
      categoryIds: [],
      tagIds: [],
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ slug est requis.',
        'Le champ title est requis.',
        'Le champ excerpt est requis.',
        'Le champ content est requis.',
        'Le champ authorId est requis.',
        'Le champ status est invalide.',
        'Le champ categoryIds doit contenir au moins une valeur.',
        'Le champ tagIds doit contenir au moins une valeur.',
      ],
    });
  });

  it('Given un payload mise à jour partiel valide, When validateUpdateArticlePayload est appelé, Then le payload normalisé est renvoyé', () => {
    const result = validateUpdateArticlePayload({
      title: '  Nouveau titre  ',
      categoryIds: [' category-3 '],
      tagIds: [' tag-4 '],
    });

    expect(result).toEqual({
      valid: true,
      data: {
        title: 'Nouveau titre',
        categoryIds: ['category-3'],
        tagIds: ['tag-4'],
      },
    });
  });

  it('Given un payload mise à jour vide, When validateUpdateArticlePayload est appelé, Then une erreur explicite est renvoyée', () => {
    const result = validateUpdateArticlePayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Au moins un champ doit être fourni pour la mise à jour.'],
    });
  });

  it('Given un corps invalide, When la validation création ou mise à jour est appelée, Then une erreur de corps invalide est renvoyée', () => {
    expect(validateCreateArticlePayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });

    expect(validateUpdateArticlePayload('invalid')).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given des champs optionnels invalides en mise à jour, When validateUpdateArticlePayload est appelé, Then les erreurs associées sont renvoyées', () => {
    const result = validateUpdateArticlePayload({
      slug: '   ',
      status: 'invalid',
      categoryIds: [],
      tagIds: [],
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ slug est requis.',
        'Le champ status est invalide.',
        'Le champ categoryIds doit contenir au moins une valeur.',
        'Le champ tagIds doit contenir au moins une valeur.',
      ],
    });
  });

  it('Given des valeurs nullable valides en mise à jour, When validateUpdateArticlePayload est appelé, Then les champs sont normalisés', () => {
    const result = validateUpdateArticlePayload({
      coverImageUrl: '',
      publishedAt: '  ',
      seoTitle: '  ',
      seoDescription: ' Description SEO ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        coverImageUrl: null,
        publishedAt: null,
        seoTitle: null,
        seoDescription: 'Description SEO',
      },
    });
  });

  it('Given des valeurs nullable invalides en mise à jour, When validateUpdateArticlePayload est appelé, Then des erreurs explicites sont renvoyées', () => {
    const result = validateUpdateArticlePayload({
      coverImageUrl: 'not-a-url',
      publishedAt: 'not-a-date',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ coverImageUrl est invalide.',
        'Le champ publishedAt est invalide.',
      ],
    });
  });

  it('Given une date publiée valide en création, When validateCreateArticlePayload est appelé, Then publishedAt est normalisé au format ISO', () => {
    const result = validateCreateArticlePayload({
      slug: 'nouvel-article',
      title: 'Titre',
      excerpt: 'Résumé',
      content: '<p>Contenu</p>',
      status: 'draft',
      authorId: 'author-1',
      categoryIds: ['category-1'],
      tagIds: ['tag-1'],
      publishedAt: '2026-05-01T08:30:00.000Z',
    });

    expect(result).toEqual({
      valid: true,
      data: expect.objectContaining({
        publishedAt: '2026-05-01T08:30:00.000Z',
      }),
    });
  });

  it('Given des champs coverImageUrl et publishedAt à null en mise à jour, When validateUpdateArticlePayload est appelé, Then ils restent explicitement à null', () => {
    const result = validateUpdateArticlePayload({
      coverImageUrl: null,
      publishedAt: null,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        coverImageUrl: null,
        publishedAt: null,
      },
    });
  });

  it('Given des valeurs nullable invalides en création, When validateCreateArticlePayload est appelé, Then des erreurs explicites sont renvoyées', () => {
    const result = validateCreateArticlePayload({
      slug: 'nouvel-article',
      title: 'Titre',
      excerpt: 'Résumé',
      content: '<p>Contenu</p>',
      status: 'draft',
      coverImageUrl: 'bad-url',
      publishedAt: 'bad-date',
      authorId: 'author-1',
      categoryIds: ['category-1'],
      tagIds: ['tag-1'],
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le champ coverImageUrl est invalide.',
        'Le champ publishedAt est invalide.',
      ],
    });
  });

  it('Given un payload categorie valide, When validateCreateCategoryPayload est appelé, Then les champs normalises sont renvoyés', () => {
    const result = validateCreateCategoryPayload({
      slug: '  immigration  ',
      label: '  Immigration  ',
      description: '  Description categorie  ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        slug: 'immigration',
        label: 'Immigration',
        description: 'Description categorie',
      },
    });
  });

  it('Given un payload tag invalide, When validateCreateTagPayload est appelé, Then les erreurs explicites sont renvoyées', () => {
    const result = validateCreateTagPayload({
      slug: '',
      label: '',
    });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ slug est requis.', 'Le champ label est requis.'],
    });
  });

  it('Given un payload categorie update vide, When validateUpdateCategoryPayload est appelé, Then une erreur est renvoyée', () => {
    const result = validateUpdateCategoryPayload({});

    expect(result).toEqual({
      valid: false,
      errors: ['Au moins un champ doit être fourni pour la mise à jour.'],
    });
  });

  it('Given un corps non objet pour categorie et tag, When validateCreateCategoryPayload et validateUpdateCategoryPayload sont appelés, Then une erreur corps invalide est renvoyée', () => {
    expect(validateCreateCategoryPayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });

    expect(validateUpdateCategoryPayload(null)).toEqual({
      valid: false,
      errors: ['Corps de requête invalide.'],
    });
  });

  it('Given un update categorie avec label vide, When validateUpdateCategoryPayload est appelé, Then une erreur explicite sur label est renvoyée', () => {
    const result = validateUpdateCategoryPayload({
      slug: 'immigration',
      label: '   ',
    });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ label est requis.'],
    });
  });

  it('Given un update categorie avec description nullable, When validateUpdateCategoryPayload est appelé, Then description est normalisée', () => {
    const result = validateUpdateCategoryPayload({
      description: '   ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        description: null,
      },
    });
  });

  it('Given un payload tag update valide, When validateUpdateTagPayload est appelé, Then les champs sont normalises', () => {
    const result = validateUpdateTagPayload({
      slug: '  integrations  ',
      label: '  Integrations  ',
    });

    expect(result).toEqual({
      valid: true,
      data: {
        slug: 'integrations',
        label: 'Integrations',
      },
    });
  });

  it('Given un payload tag avec description, When validateCreateTagPayload est appelé, Then une erreur explicite est renvoyée', () => {
    const result = validateCreateTagPayload({
      slug: 'tag-1',
      label: 'Tag 1',
      description: 'Description interdite',
    });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ description n’est pas autorisé pour un tag.'],
    });
  });

  it('Given un payload tag update avec description, When validateUpdateTagPayload est appelé, Then une erreur explicite est renvoyée', () => {
    const result = validateUpdateTagPayload({
      description: 'Description interdite',
    });

    expect(result).toEqual({
      valid: false,
      errors: ['Le champ description n’est pas autorisé pour un tag.'],
    });
  });
});
