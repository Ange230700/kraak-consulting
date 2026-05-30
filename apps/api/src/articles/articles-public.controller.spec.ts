import { NotFoundException } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesPublicController } from './articles-public.controller';
import { ArticlesService } from './articles.service';

describe('ArticlesPublicController', () => {
  let controller: ArticlesPublicController;

  const articlesService = {
    listPublicArticles: jest.fn(),
    getPublicArticleBySlug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    articlesService.listPublicArticles.mockResolvedValue([]);
    articlesService.getPublicArticleBySlug.mockResolvedValue({
      id: 'article-1',
      slug: 'article-1',
      title: 'Article 1',
      excerpt: 'Resume article 1',
      content: '<p>Contenu article 1</p>',
      status: 'published',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: '2026-05-24T10:00:00.000Z',
      authorId: 'author-1',
      categoryIds: ['category-1'],
      tagIds: ['tag-1'],
      createdAt: '2026-05-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesPublicController],
      providers: [
        {
          provide: ArticlesService,
          useValue: articlesService,
        },
      ],
    }).compile();

    controller = module.get<ArticlesPublicController>(ArticlesPublicController);
  });

  it('Given des articles publics disponibles, When listPublishedArticles est appele, Then la liste publiee est renvoyee', async () => {
    await expect(controller.listPublishedArticles()).resolves.toEqual([]);
    expect(articlesService.listPublicArticles).toHaveBeenCalledTimes(1);
  });

  it('Given le module public articles, When on lit les metadonnees NestJS, Then les routes GET sont exposees', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ArticlesPublicController)).toBe(
      'articles',
    );
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.listPublishedArticles),
    ).toBe(RequestMethod.GET);
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.getArticleBySlug),
    ).toBe(RequestMethod.GET);
  });

  it('Given un slug valide, When getArticleBySlug est appele, Then le detail public est renvoye', async () => {
    await expect(
      controller.getArticleBySlug('article-1'),
    ).resolves.toMatchObject({
      slug: 'article-1',
      status: 'published',
    });

    expect(articlesService.getPublicArticleBySlug).toHaveBeenCalledWith(
      'article-1',
    );
  });

  it('Given un slug inconnu, When getArticleBySlug est appele, Then une NotFoundException est renvoyee', async () => {
    articlesService.getPublicArticleBySlug.mockRejectedValueOnce(
      new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      }),
    );

    await expect(controller.getArticleBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('Given Reflect decorate/metadata indisponibles, When le module public controller est charge, Then le controleur reste chargeable', async () => {
    const originalDecorate = Reflect.decorate;
    const originalMetadata = Reflect.metadata;

    try {
      jest.resetModules();
      Reflect.decorate = undefined;
      Reflect.metadata = undefined;

      await jest.isolateModulesAsync(async () => {
        const reloaded = (await import('./articles-public.controller')) as {
          ArticlesPublicController: unknown;
        };

        expect(reloaded.ArticlesPublicController).toBeDefined();
      });
    } finally {
      Reflect.decorate = originalDecorate;
      Reflect.metadata = originalMetadata;
    }
  });
});
