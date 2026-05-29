import type { ArticleDto } from '@kraak/contracts';
import {
  blogArticles,
  buildBlogArticleSeo,
  buildMissingBlogArticleSeo,
  findBlogArticleBySlug,
  getFallbackBlogArticles,
  getRelatedBlogArticles,
  mapPublicArticleToBlogArticle,
  mapPublicArticlesToBlogArticles,
} from './blog.data';

describe('blog.data', () => {
  it('Given fallback blog articles, When requested, Then the static fallback list is returned', () => {
    expect(getFallbackBlogArticles()).toBe(blogArticles);
    expect(getFallbackBlogArticles().length).toBeGreaterThan(0);
  });

  it('Given a public article sharing an existing slug, When mapped, Then fallback metadata is reused', () => {
    const source: ArticleDto = {
      id: 'api-article-1',
      slug: blogArticles[0].slug,
      title: 'Titre API',
      excerpt: 'Résumé API',
      content: '<p>Contenu API</p>',
      status: 'published',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: '2026-01-01T00:00:00.000Z',
      authorId: 'author-api',
      categoryIds: ['cat-a'],
      tagIds: ['tag-a'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    const mapped = mapPublicArticleToBlogArticle(source);

    expect(mapped.author).toEqual(blogArticles[0].author);
    expect(mapped.coverImagePath).toBe(blogArticles[0].coverImagePath);
    expect(mapped.readingTimeMinutes).toBe(blogArticles[0].readingTimeMinutes);
    expect(mapped.intro).toBe(blogArticles[0].intro);
    expect(mapped.sections).toEqual(blogArticles[0].sections);
  });

  it('Given a public article with fallback by id only, When mapped, Then id fallback is applied', () => {
    const source: ArticleDto = {
      id: blogArticles[1].id,
      slug: 'slug-non-reference',
      title: 'Titre API 2',
      excerpt: 'Résumé API 2',
      content: '<p>Contenu API 2</p>',
      status: 'published',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: '2026-01-03T00:00:00.000Z',
      authorId: 'author-api-2',
      categoryIds: ['cat-b'],
      tagIds: ['tag-b'],
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-04T00:00:00.000Z',
    };

    const mapped = mapPublicArticleToBlogArticle(source);

    expect(mapped.author).toEqual(blogArticles[1].author);
    expect(mapped.categorySlug).toBe(blogArticles[1].categorySlug);
    expect(mapped.relatedSlugs).toEqual(blogArticles[1].relatedSlugs);
  });

  it('Given a public article without fallback and empty content, When mapped, Then default copy and fallback SEO fields are used', () => {
    const source: ArticleDto = {
      id: 'api-no-fallback',
      slug: 'nouvel-article',
      title: 'Nouvel article',
      excerpt: 'Résumé neuf',
      content: '   ',
      status: 'published',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: null,
      authorId: 'author-api-3',
      categoryIds: ['cat-c'],
      tagIds: ['tag-c'],
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-02T00:00:00.000Z',
    };

    const mapped = mapPublicArticleToBlogArticle(source);

    expect(mapped.categoryLabel).toBe('Actualités');
    expect(mapped.categorySlug).toBe('actualites');
    expect(mapped.coverImagePath).toContain('home-hero-workshop');
    expect(mapped.publishedLabel).toBe('Publication à venir');
    expect(mapped.intro).toBe('Cet article est disponible dans le blog KRAAK.');
    expect(mapped.sections[0].heading).toBe('Contenu');
    expect(mapped.sections[0].paragraphs[0]).toContain('bientôt enrichi');
    expect(mapped.featured).toBe(false);
  });

  it('Given a public article with invalid date and HTML content, When mapped, Then date fallback and reading-time estimation are used', () => {
    const source: ArticleDto = {
      id: 'api-invalid-date',
      slug: 'article-date-invalide',
      title: 'Article date invalide',
      excerpt: 'Résumé date invalide',
      content: '<p>Premier mot</p> <p>Deuxième mot</p>',
      status: 'published',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: 'date-invalide',
      authorId: 'author-api-4',
      categoryIds: ['cat-d'],
      tagIds: ['tag-d'],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    };

    const mapped = mapPublicArticleToBlogArticle(source);

    expect(mapped.publishedLabel).toBe('Publication récente');
    expect(mapped.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(mapped.intro.length).toBeGreaterThan(0);
    expect(mapped.sections[0].paragraphs[0]).toContain('Premier mot');
  });

  it('Given a mixed list of public articles, When mapped as a collection, Then they are sorted by publication date descending', () => {
    const older: ArticleDto = {
      id: 'collection-1',
      slug: 'collection-older',
      title: 'Older',
      excerpt: 'Older',
      content: '<p>Older</p>',
      status: 'published',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: '2026-01-01T00:00:00.000Z',
      authorId: 'a',
      categoryIds: [],
      tagIds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const newer: ArticleDto = {
      ...older,
      id: 'collection-2',
      slug: 'collection-newer',
      publishedAt: '2026-02-01T00:00:00.000Z',
    };
    const undated: ArticleDto = {
      ...older,
      id: 'collection-3',
      slug: 'collection-undated',
      publishedAt: null,
    };

    const mapped = mapPublicArticlesToBlogArticles([older, undated, newer]);

    expect(mapped[0].slug).toBe('collection-newer');
    expect(mapped[1].slug).toBe('collection-older');
    expect(mapped[2].slug).toBe('collection-undated');
  });

  it('Given mapped blog article SEO helpers, When building SEO payloads, Then defaults and article metadata are consistent', () => {
    const articleSeo = buildBlogArticleSeo({
      ...blogArticles[0],
      seoTitle: null,
      seoDescription: null,
    });
    const missingSeo = buildMissingBlogArticleSeo('inconnu');

    expect(articleSeo.path).toBe(`blog/${blogArticles[0].slug}`);
    expect(articleSeo.title).toContain(blogArticles[0].title);
    expect(articleSeo.description).toBe(blogArticles[0].summary);
    expect(missingSeo.path).toBe('blog/inconnu');
    expect(missingSeo.title).toContain('Article introuvable');
  });

  it('Given blog search helpers, When querying by slug and related articles, Then lookup and ranking honor filters and limits', () => {
    const found = findBlogArticleBySlug(blogArticles[0].slug);
    const missing = findBlogArticleBySlug('slug-absent');
    const related = getRelatedBlogArticles(blogArticles[0], blogArticles, 2);

    expect(found?.slug).toBe(blogArticles[0].slug);
    expect(missing).toBeUndefined();
    expect(related).toHaveLength(2);
    expect(
      related.every((article) => article.slug !== blogArticles[0].slug),
    ).toBe(true);
  });

  it('Given related articles with mixed categories, When scored, Then same-category bonus outranks tag-only matches', () => {
    const reference = blogArticles[0];
    const sameCategory = {
      ...blogArticles[1],
      slug: 'same-category',
      categorySlug: reference.categorySlug,
      tagLabels: ['Tag différent'],
    };
    const tagMatchOnly = {
      ...blogArticles[2],
      slug: 'tag-match-only',
      categorySlug: 'categorie-differente',
      tagLabels: [reference.tagLabels[0]],
    };

    const ranked = getRelatedBlogArticles(
      reference,
      [reference, tagMatchOnly, sameCategory],
      2,
    );

    expect(ranked[0].slug).toBe('same-category');
    expect(ranked[1].slug).toBe('tag-match-only');
  });
});
