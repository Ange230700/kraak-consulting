import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  ArticleDto,
  CreateArticleDto,
  UpdateArticleDto,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: ArticleDto['status'];
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
};

type AppUserRow = {
  id: string;
  role: string;
};

type ArticleCategoryRow = {
  article_id: string;
  category_id: string;
};

type ArticleTagRow = {
  article_id: string;
  tag_id: string;
};

type TaxonomyIdRow = {
  id: string;
};

const articleSelectFields =
  'id, slug, title, excerpt, content, status, cover_image_url, seo_title, seo_description, published_at, author_id, created_at, updated_at';
const notFoundSupabaseErrorCodes = new Set(['PGRST116']);

@Injectable()
export class ArticlesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listArticles(accessToken: string): Promise<ArticleDto[]> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('article')
      .select(articleSelectFields)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les articles.',
      });
    }

    const rows = (data as ArticleRow[] | null) ?? [];
    const relations = await this.readArticleRelations(
      rows.map((row) => row.id),
    );

    return rows.map((row) => this.mapArticleRow(row, relations));
  }

  async getArticleById(
    accessToken: string,
    articleId: string,
  ): Promise<ArticleDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('article')
      .select(articleSelectFields)
      .eq('id', articleId)
      .neq('status', 'archived')
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      });
    }

    const relations = await this.readArticleRelations([articleId]);

    return this.mapArticleRow(data as ArticleRow, relations);
  }

  async createArticle(
    accessToken: string,
    payload: CreateArticleDto,
  ): Promise<ArticleDto> {
    await this.assertAdminAccess(accessToken);
    await this.assertActiveTaxonomyIds(payload.categoryIds, payload.tagIds);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('article')
      .insert({
        slug: payload.slug,
        title: payload.title,
        excerpt: payload.excerpt,
        content: payload.content,
        status: payload.status,
        cover_image_url: payload.coverImageUrl,
        seo_title: payload.seoTitle,
        seo_description: payload.seoDescription,
        published_at: payload.publishedAt,
        author_id: payload.authorId,
      })
      .select(articleSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de créer l'article.",
      });
    }

    const articleId = (data as ArticleRow).id;
    await this.syncArticleRelations(
      articleId,
      payload.categoryIds,
      payload.tagIds,
    );

    const relations = await this.readArticleRelations([articleId]);
    return this.mapArticleRow(data as ArticleRow, relations);
  }

  async updateArticle(
    accessToken: string,
    articleId: string,
    payload: UpdateArticleDto,
  ): Promise<ArticleDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();

    const updatePayload: Record<string, unknown> = {};

    if (payload.slug !== undefined) {
      updatePayload['slug'] = payload.slug;
    }

    if (payload.title !== undefined) {
      updatePayload['title'] = payload.title;
    }

    if (payload.excerpt !== undefined) {
      updatePayload['excerpt'] = payload.excerpt;
    }

    if (payload.content !== undefined) {
      updatePayload['content'] = payload.content;
    }

    if (payload.status !== undefined) {
      updatePayload['status'] = payload.status;
    }

    if (payload.coverImageUrl !== undefined) {
      updatePayload['cover_image_url'] = payload.coverImageUrl;
    }

    if (payload.seoTitle !== undefined) {
      updatePayload['seo_title'] = payload.seoTitle;
    }

    if (payload.seoDescription !== undefined) {
      updatePayload['seo_description'] = payload.seoDescription;
    }

    if (payload.publishedAt !== undefined) {
      updatePayload['published_at'] = payload.publishedAt;
    }

    if (payload.authorId !== undefined) {
      updatePayload['author_id'] = payload.authorId;
    }

    const { data, error } = await adminClient
      .from('article')
      .update(updatePayload)
      .eq('id', articleId)
      .neq('status', 'archived')
      .select(articleSelectFields)
      .single();

    if (error) {
      const errorCode =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : null;

      if (errorCode !== null && notFoundSupabaseErrorCodes.has(errorCode)) {
        throw new NotFoundException({
          success: false,
          message: 'Article introuvable.',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de mettre à jour l'article.",
      });
    }

    if (!data) {
      throw new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      });
    }

    if (payload.categoryIds !== undefined || payload.tagIds !== undefined) {
      const currentRelations = await this.readArticleRelations([articleId]);
      const nextCategoryIds =
        payload.categoryIds ??
        currentRelations.categoryByArticleId.get(articleId) ??
        [];
      const nextTagIds =
        payload.tagIds ?? currentRelations.tagByArticleId.get(articleId) ?? [];

      await this.syncArticleRelations(articleId, nextCategoryIds, nextTagIds);
    }

    const relations = await this.readArticleRelations([articleId]);
    return this.mapArticleRow(data as ArticleRow, relations);
  }

  async deleteArticle(accessToken: string, articleId: string): Promise<void> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data: existing, error: existingError } = await adminClient
      .from('article')
      .select('id')
      .eq('id', articleId)
      .neq('status', 'archived')
      .maybeSingle();

    if (existingError) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de supprimer l'article.",
      });
    }

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      });
    }

    const { error: archiveError } = await adminClient
      .from('article')
      .update({
        status: 'archived',
        published_at: null,
      })
      .eq('id', articleId);

    if (archiveError) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible d'archiver l'article.",
      });
    }
  }

  private async assertAdminAccess(accessToken: string): Promise<string> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Session invalide.',
      });
    }

    const adminClient = this.supabaseService.getClient();
    const { data: appUser, error: appUserError } = await adminClient
      .from('app_user')
      .select('id, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (appUserError || !appUser) {
      throw new ForbiddenException({
        success: false,
        message: 'Accès admin requis.',
      });
    }

    if ((appUser as AppUserRow).role !== 'admin') {
      throw new ForbiddenException({
        success: false,
        message: 'Accès admin requis.',
      });
    }

    return data.user.id;
  }

  private async syncArticleRelations(
    articleId: string,
    categoryIds: string[],
    tagIds: string[],
  ): Promise<void> {
    await this.assertActiveTaxonomyIds(categoryIds, tagIds);

    const adminClient = this.supabaseService.getClient();

    const { error: deleteCategoryError } = await adminClient
      .from('article_category')
      .delete()
      .eq('article_id', articleId);

    if (deleteCategoryError) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de mettre à jour les catégories de l'article.",
      });
    }

    if (categoryIds.length > 0) {
      const { error: insertCategoryError } = await adminClient
        .from('article_category')
        .insert(
          categoryIds.map((categoryId) => ({
            article_id: articleId,
            category_id: categoryId,
          })),
        );

      if (insertCategoryError) {
        throw new InternalServerErrorException({
          success: false,
          message: "Impossible de mettre à jour les catégories de l'article.",
        });
      }
    }

    const { error: deleteTagError } = await adminClient
      .from('article_tag')
      .delete()
      .eq('article_id', articleId);

    if (deleteTagError) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de mettre à jour les tags de l'article.",
      });
    }

    if (tagIds.length > 0) {
      const { error: insertTagError } = await adminClient
        .from('article_tag')
        .insert(
          tagIds.map((tagId) => ({
            article_id: articleId,
            tag_id: tagId,
          })),
        );

      if (insertTagError) {
        throw new InternalServerErrorException({
          success: false,
          message: "Impossible de mettre à jour les tags de l'article.",
        });
      }
    }
  }

  private async readArticleRelations(articleIds: string[]): Promise<{
    categoryByArticleId: Map<string, string[]>;
    tagByArticleId: Map<string, string[]>;
  }> {
    const categoryByArticleId = new Map<string, string[]>();
    const tagByArticleId = new Map<string, string[]>();

    if (articleIds.length === 0) {
      return { categoryByArticleId, tagByArticleId };
    }

    const adminClient = this.supabaseService.getClient();
    const [
      { data: categoryRows, error: categoryError },
      { data: tagRows, error: tagError },
    ] = await Promise.all([
      adminClient
        .from('article_category')
        .select('article_id, category_id')
        .in('article_id', articleIds)
        .limit(1000),
      adminClient
        .from('article_tag')
        .select('article_id, tag_id')
        .in('article_id', articleIds)
        .limit(1000),
    ]);

    if (categoryError || tagError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les relations article.',
      });
    }

    const relationCategoryIds = [
      ...new Set(
        ((categoryRows as ArticleCategoryRow[] | null) ?? []).map(
          (row) => row.category_id,
        ),
      ),
    ];
    const relationTagIds = [
      ...new Set(
        ((tagRows as ArticleTagRow[] | null) ?? []).map((row) => row.tag_id),
      ),
    ];
    const { activeCategoryIds, activeTagIds } =
      await this.readActiveTaxonomyIdSets(relationCategoryIds, relationTagIds);

    for (const row of (categoryRows as ArticleCategoryRow[] | null) ?? []) {
      if (!activeCategoryIds.has(row.category_id)) {
        continue;
      }

      const existing = categoryByArticleId.get(row.article_id) ?? [];
      categoryByArticleId.set(row.article_id, [...existing, row.category_id]);
    }

    for (const row of (tagRows as ArticleTagRow[] | null) ?? []) {
      if (!activeTagIds.has(row.tag_id)) {
        continue;
      }

      const existing = tagByArticleId.get(row.article_id) ?? [];
      tagByArticleId.set(row.article_id, [...existing, row.tag_id]);
    }

    return { categoryByArticleId, tagByArticleId };
  }

  private mapArticleRow(
    row: ArticleRow,
    relations: {
      categoryByArticleId: Map<string, string[]>;
      tagByArticleId: Map<string, string[]>;
    },
  ): ArticleDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      status: row.status,
      coverImageUrl: row.cover_image_url,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      publishedAt: row.published_at,
      authorId: row.author_id,
      categoryIds: relations.categoryByArticleId.get(row.id) ?? [],
      tagIds: relations.tagByArticleId.get(row.id) ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async assertActiveTaxonomyIds(
    categoryIds: string[],
    tagIds: string[],
  ): Promise<void> {
    const requestedCategoryIds = [...new Set(categoryIds)];
    const requestedTagIds = [...new Set(tagIds)];

    const { activeCategoryIds, activeTagIds } =
      await this.readActiveTaxonomyIdSets(
        requestedCategoryIds,
        requestedTagIds,
      );

    if (
      activeCategoryIds.size !== requestedCategoryIds.length ||
      activeTagIds.size !== requestedTagIds.length
    ) {
      throw new BadRequestException({
        success: false,
        message:
          'Certaines catégories ou certains tags sont introuvables ou archivés.',
      });
    }
  }

  private async readActiveTaxonomyIdSets(
    categoryIds: string[],
    tagIds: string[],
  ): Promise<{
    activeCategoryIds: Set<string>;
    activeTagIds: Set<string>;
  }> {
    const adminClient = this.supabaseService.getClient();

    const categoryQuery =
      categoryIds.length === 0
        ? Promise.resolve({
            data: [] as TaxonomyIdRow[],
            error: null,
          })
        : adminClient
            .from('category')
            .select('id')
            .in('id', categoryIds)
            .neq('status', 'archived')
            .limit(1000);

    const tagQuery =
      tagIds.length === 0
        ? Promise.resolve({
            data: [] as TaxonomyIdRow[],
            error: null,
          })
        : adminClient
            .from('tag')
            .select('id')
            .in('id', tagIds)
            .neq('status', 'archived')
            .limit(1000);

    const [
      { data: categoriesData, error: categoryError },
      { data: tagsData, error: tagError },
    ] = await Promise.all([categoryQuery, tagQuery]);

    if (categoryError || tagError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de valider les catégories et tags.',
      });
    }

    const activeCategoryIds = new Set(
      ((categoriesData as TaxonomyIdRow[] | null) ?? []).map((row) => row.id),
    );
    const activeTagIds = new Set(
      ((tagsData as TaxonomyIdRow[] | null) ?? []).map((row) => row.id),
    );

    return { activeCategoryIds, activeTagIds };
  }
}
