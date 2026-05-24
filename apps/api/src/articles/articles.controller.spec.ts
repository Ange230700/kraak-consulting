import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

describe('ArticlesController', () => {
  let controller: ArticlesController;

  const articlesService = {
    listArticles: jest.fn(),
    getArticleById: jest.fn(),
    createArticle: jest.fn(),
    updateArticle: jest.fn(),
    deleteArticle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    articlesService.listArticles.mockResolvedValue([]);
    articlesService.getArticleById.mockResolvedValue({
      id: 'article-1',
      slug: 'article-1',
      title: 'Article 1',
      excerpt: 'Résumé article 1',
      content: '<p>Contenu 1</p>',
      status: 'draft',
      coverImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: null,
      authorId: 'author-1',
      categoryIds: ['category-1'],
      tagIds: ['tag-1'],
      createdAt: '2026-05-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
    articlesService.createArticle.mockResolvedValue(
      articlesService.getArticleById(),
    );
    articlesService.updateArticle.mockResolvedValue(
      articlesService.getArticleById(),
    );
    articlesService.deleteArticle.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: articlesService,
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
  });

  it('Given le module articles admin, When on lit les métadonnées NestJS, Then le préfixe admin/articles est exposé', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ArticlesController)).toBe(
      'admin/articles',
    );
  });

  it('Given le module articles admin, When on lit les routes, Then GET/POST/PATCH/DELETE sont exposées', () => {
    expect(Reflect.getMetadata(METHOD_METADATA, controller.listArticles)).toBe(
      RequestMethod.GET,
    );
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.getArticleById),
    ).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(METHOD_METADATA, controller.createArticle)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(METHOD_METADATA, controller.updateArticle)).toBe(
      RequestMethod.PATCH,
    );
    expect(Reflect.getMetadata(METHOD_METADATA, controller.deleteArticle)).toBe(
      RequestMethod.DELETE,
    );
  });

  it('Given un header Authorization valide, When listArticles est appelé, Then le token est transmis au service', async () => {
    await controller.listArticles('Bearer access-token');

    expect(articlesService.listArticles).toHaveBeenCalledWith('access-token');
  });

  it('Given un header Authorization absent, When listArticles est appelé, Then une UnauthorizedException est renvoyée', async () => {
    await expect(controller.listArticles()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('Given un payload création invalide, When createArticle est appelé, Then une BadRequestException est renvoyée', async () => {
    await expect(
      controller.createArticle(
        {
          slug: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given un article introuvable, When getArticleById est appelé, Then la NotFoundException est propagée', async () => {
    articlesService.getArticleById.mockRejectedValueOnce(
      new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      }),
    );

    await expect(
      controller.getArticleById('article-missing', 'Bearer access-token'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given un utilisateur non admin, When createArticle est appelé, Then la ForbiddenException est propagée', async () => {
    articlesService.createArticle.mockRejectedValueOnce(
      new ForbiddenException({
        success: false,
        message: 'Accès admin requis.',
      }),
    );

    await expect(
      controller.createArticle(
        {
          slug: 'article-1',
          title: 'Title',
          excerpt: 'Résumé suffisamment long.',
          content: '<p>Contenu</p>',
          status: 'draft',
          authorId: 'author-1',
          categoryIds: ['category-1'],
          tagIds: ['tag-1'],
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
