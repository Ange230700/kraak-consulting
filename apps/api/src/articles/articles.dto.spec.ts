import {
  validateCreateArticlePayload,
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
});
