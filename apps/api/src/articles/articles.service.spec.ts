import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { ArticlesService } from './articles.service';

function createSingleRowQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function createListQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };
}

function createUpdateQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };
}

describe('ArticlesService', () => {
  let service: ArticlesService;

  const authClient = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const adminClient = {
    from: jest.fn(),
  };

  const supabaseService = {
    createAuthClient: jest.fn(() => authClient),
    getClient: jest.fn(() => adminClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    authClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('Given un token admin valide, When listArticles est appelé, Then les articles mappés sont renvoyés', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'admin' },
      error: null,
    });

    const articleQuery = createListQuery({
      data: [
        {
          id: 'article-1',
          slug: 'article-1',
          title: 'Article 1',
          excerpt: 'Résumé article 1',
          content: '<p>Contenu 1</p>',
          status: 'draft',
          cover_image_url: null,
          seo_title: null,
          seo_description: null,
          published_at: null,
          author_id: 'author-1',
          created_at: '2026-05-24T10:00:00.000Z',
          updated_at: '2026-05-24T10:00:00.000Z',
        },
      ],
      error: null,
    });

    const articleCategoryQuery = createListQuery({
      data: [{ article_id: 'article-1', category_id: 'category-1' }],
      error: null,
    });

    const articleTagQuery = createListQuery({
      data: [{ article_id: 'article-1', tag_id: 'tag-1' }],
      error: null,
    });

    const categoryQuery = createListQuery({
      data: [{ id: 'category-1' }],
      error: null,
    });

    const tagQuery = createListQuery({
      data: [{ id: 'tag-1' }],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'article') {
        return articleQuery;
      }

      if (tableName === 'article_category') {
        return articleCategoryQuery;
      }

      if (tableName === 'article_tag') {
        return articleTagQuery;
      }

      if (tableName === 'category') {
        return categoryQuery;
      }

      if (tableName === 'tag') {
        return tagQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listArticles('access-token')).resolves.toEqual([
      {
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
      },
    ]);

    expect(articleQuery.neq).toHaveBeenCalledWith('status', 'archived');
  });

  it('Given un token invalide, When listArticles est appelé, Then une UnauthorizedException est renvoyée', async () => {
    authClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    await expect(service.listArticles('invalid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('Given un utilisateur non admin, When listArticles est appelé, Then une ForbiddenException est renvoyée', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'participant' },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listArticles('access-token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('Given une erreur de lecture article, When listArticles est appelé, Then une InternalServerErrorException est renvoyée', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'admin' },
      error: null,
    });

    const articleQuery = createListQuery({
      data: null,
      error: { message: 'db error' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'article') {
        return articleQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(service.listArticles('access-token')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('Given une catégorie archivée, When createArticle est appelé, Then une BadRequestException est renvoyée', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'admin' },
      error: null,
    });

    const categoryQuery = createListQuery({
      data: [],
      error: null,
    });

    const tagQuery = createListQuery({
      data: [{ id: 'tag-1' }],
      error: null,
    });

    const articleInsertQuery = createSingleRowQuery({
      data: {
        id: 'article-1',
      },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'category') {
        return categoryQuery;
      }

      if (tableName === 'tag') {
        return tagQuery;
      }

      if (tableName === 'article') {
        return articleInsertQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.createArticle('access-token', {
        slug: 'article-1',
        title: 'Article 1',
        excerpt: 'Résumé article 1',
        content: '<p>Contenu article 1</p>',
        status: 'draft',
        coverImageUrl: null,
        seoTitle: null,
        seoDescription: null,
        publishedAt: null,
        authorId: 'author-1',
        categoryIds: ['category-archived'],
        tagIds: ['tag-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(articleInsertQuery.single).not.toHaveBeenCalled();
  });

  it('Given un article existant, When deleteArticle est appelé, Then il est archivé sans suppression physique', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'admin' },
      error: null,
    });
    const articleSoftDeleteQuery = createUpdateQuery({
      data: { id: 'article-1', status: 'archived' },
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'article') {
        return articleSoftDeleteQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.deleteArticle('access-token', 'article-1'),
    ).resolves.toBeUndefined();
    expect(articleSoftDeleteQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'archived',
        published_at: null,
      }),
    );
  });

  it('Given un article absent, When deleteArticle est appelé, Then une NotFoundException est renvoyée', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'admin' },
      error: null,
    });
    const articleMissingQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'article') {
        return articleMissingQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.deleteArticle('access-token', 'article-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given un article déjà archivé, When deleteArticle est appelé, Then une NotFoundException est renvoyée', async () => {
    const appUserQuery = createSingleRowQuery({
      data: { id: 'user-1', role: 'admin' },
      error: null,
    });
    const archivedArticleQuery = createSingleRowQuery({
      data: null,
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'app_user') {
        return appUserQuery;
      }

      if (tableName === 'article') {
        return archivedArticleQuery;
      }

      throw new Error(`Unexpected table ${tableName}`);
    });

    await expect(
      service.deleteArticle('access-token', 'article-archived'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(archivedArticleQuery.neq).toHaveBeenCalledWith('status', 'archived');
  });
});
