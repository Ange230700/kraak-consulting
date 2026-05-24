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
  CategoryDto,
  CreateArticleDto,
  CreateCategoryDto,
  CreateTagDto,
  TagDto,
  UpdateArticleDto,
  UpdateCategoryDto,
  UpdateTagDto,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';

type UploadedCoverImage = {
  url: string;
  path: string;
};

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

type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  status: ArticleDto['status'];
  created_at: string;
  updated_at: string;
};

type TagRow = {
  id: string;
  slug: string;
  label: string;
  status: ArticleDto['status'];
  created_at: string;
  updated_at: string;
};

const articleSelectFields =
  'id, slug, title, excerpt, content, status, cover_image_url, seo_title, seo_description, published_at, author_id, created_at, updated_at';
const categorySelectFields =
  'id, slug, label, description, status, created_at, updated_at';
const tagSelectFields = 'id, slug, label, status, created_at, updated_at';
const notFoundSupabaseErrorCodes = new Set(['PGRST116']);

@Injectable()
export class ArticlesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private readSupabaseErrorCode(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code;
    }

    return null;
  }

  async listPublicArticles(): Promise<ArticleDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('article')
      .select(articleSelectFields)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les articles publiés.',
      });
    }

    const rows = (data as ArticleRow[] | null) ?? [];
    const relations = await this.readArticleRelations(
      rows.map((row) => row.id),
    );

    return rows.map((row) => this.mapArticleRow(row, relations));
  }

  async getPublicArticleBySlug(slug: string): Promise<ArticleDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('article')
      .select(articleSelectFields)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (
        notFoundSupabaseErrorCodes.has(this.readSupabaseErrorCode(error) ?? '')
      ) {
        throw new NotFoundException({
          success: false,
          message: 'Article introuvable.',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de charger l'article demandé.",
      });
    }

    if (!data) {
      throw new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      });
    }

    const articleRow = data as ArticleRow;
    const relations = await this.readArticleRelations([articleRow.id]);
    return this.mapArticleRow(articleRow, relations);
  }

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

  private buildUpdatePayload(
    payload: UpdateArticleDto,
  ): Record<string, unknown> {
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

    return updatePayload;
  }

  private handleUpdateError(error: unknown): void {
    const errorCode = this.readSupabaseErrorCode(error);

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

  async updateArticle(
    accessToken: string,
    articleId: string,
    payload: UpdateArticleDto,
  ): Promise<ArticleDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const updatePayload = this.buildUpdatePayload(payload);

    const { data, error } = await adminClient
      .from('article')
      .update(updatePayload)
      .eq('id', articleId)
      .neq('status', 'archived')
      .select(articleSelectFields)
      .single();

    if (error) {
      this.handleUpdateError(error);
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

  async publishArticle(
    accessToken: string,
    articleId: string,
  ): Promise<ArticleDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('article')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .neq('status', 'archived')
      .select(articleSelectFields)
      .single();

    if (error) {
      if (
        notFoundSupabaseErrorCodes.has(this.readSupabaseErrorCode(error) ?? '')
      ) {
        throw new NotFoundException({
          success: false,
          message: 'Article introuvable.',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de publier l'article.",
      });
    }

    if (!data) {
      throw new NotFoundException({
        success: false,
        message: 'Article introuvable.',
      });
    }

    const row = data as ArticleRow;
    const relations = await this.readArticleRelations([row.id]);
    return this.mapArticleRow(row, relations);
  }

  async uploadCoverImage(
    accessToken: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ): Promise<UploadedCoverImage> {
    await this.assertAdminAccess(accessToken);

    if (file.mimetype.startsWith('image/') === false) {
      throw new BadRequestException({
        success: false,
        message: 'Le fichier doit être une image.',
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException({
        success: false,
        message: "L'image de couverture dépasse la limite de 5MB.",
      });
    }

    const adminClient = this.supabaseService.getClient();
    const normalizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    const uploadPath = `articles/${Date.now()}-${normalizedName}`;

    const { error } = await adminClient.storage
      .from('article-covers')
      .upload(uploadPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible d'envoyer l'image de couverture.",
      });
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from('article-covers').getPublicUrl(uploadPath);

    return {
      url: publicUrl,
      path: uploadPath,
    };
  }

  async listCategories(accessToken: string): Promise<CategoryDto[]> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('category')
      .select(categorySelectFields)
      .neq('status', 'archived')
      .order('label', { ascending: true })
      .limit(200);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les catégories.',
      });
    }

    return ((data as CategoryRow[] | null) ?? []).map((row) =>
      this.mapCategoryRow(row),
    );
  }

  async createCategory(
    accessToken: string,
    payload: CreateCategoryDto,
  ): Promise<CategoryDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('category')
      .insert({
        slug: payload.slug,
        label: payload.label,
        description: payload.description,
        status: 'draft',
      })
      .select(categorySelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer la catégorie.',
      });
    }

    return this.mapCategoryRow(data as CategoryRow);
  }

  async updateCategory(
    accessToken: string,
    categoryId: string,
    payload: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('category')
      .update({
        slug: payload.slug,
        label: payload.label,
        description: payload.description,
      })
      .eq('id', categoryId)
      .neq('status', 'archived')
      .select(categorySelectFields)
      .single();

    if (error) {
      if (
        notFoundSupabaseErrorCodes.has(this.readSupabaseErrorCode(error) ?? '')
      ) {
        throw new NotFoundException({
          success: false,
          message: 'Catégorie introuvable.',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de mettre à jour la catégorie.',
      });
    }

    if (!data) {
      throw new NotFoundException({
        success: false,
        message: 'Catégorie introuvable.',
      });
    }

    return this.mapCategoryRow(data as CategoryRow);
  }

  async deleteCategory(accessToken: string, categoryId: string): Promise<void> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data: existing, error: existingError } = await adminClient
      .from('category')
      .select('id')
      .eq('id', categoryId)
      .neq('status', 'archived')
      .maybeSingle();

    if (existingError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible d’archiver la catégorie.',
      });
    }

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Catégorie introuvable.',
      });
    }

    const { error } = await adminClient
      .from('category')
      .update({ status: 'archived' })
      .eq('id', categoryId)
      .neq('status', 'archived');

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible d’archiver la catégorie.',
      });
    }
  }

  async listTags(accessToken: string): Promise<TagDto[]> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('tag')
      .select(tagSelectFields)
      .neq('status', 'archived')
      .order('label', { ascending: true })
      .limit(200);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les tags.',
      });
    }

    return ((data as TagRow[] | null) ?? []).map((row) => this.mapTagRow(row));
  }

  async createTag(accessToken: string, payload: CreateTagDto): Promise<TagDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('tag')
      .insert({
        slug: payload.slug,
        label: payload.label,
        status: 'draft',
      })
      .select(tagSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer le tag.',
      });
    }

    return this.mapTagRow(data as TagRow);
  }

  async updateTag(
    accessToken: string,
    tagId: string,
    payload: UpdateTagDto,
  ): Promise<TagDto> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('tag')
      .update({
        slug: payload.slug,
        label: payload.label,
      })
      .eq('id', tagId)
      .neq('status', 'archived')
      .select(tagSelectFields)
      .single();

    if (error) {
      if (
        notFoundSupabaseErrorCodes.has(this.readSupabaseErrorCode(error) ?? '')
      ) {
        throw new NotFoundException({
          success: false,
          message: 'Tag introuvable.',
        });
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de mettre à jour le tag.',
      });
    }

    if (!data) {
      throw new NotFoundException({
        success: false,
        message: 'Tag introuvable.',
      });
    }

    return this.mapTagRow(data as TagRow);
  }

  async deleteTag(accessToken: string, tagId: string): Promise<void> {
    await this.assertAdminAccess(accessToken);

    const adminClient = this.supabaseService.getClient();
    const { data: existing, error: existingError } = await adminClient
      .from('tag')
      .select('id')
      .eq('id', tagId)
      .neq('status', 'archived')
      .maybeSingle();

    if (existingError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible d’archiver le tag.',
      });
    }

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Tag introuvable.',
      });
    }

    const { error } = await adminClient
      .from('tag')
      .update({ status: 'archived' })
      .eq('id', tagId)
      .neq('status', 'archived');

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible d’archiver le tag.',
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

  private mapCategoryRow(row: CategoryRow): CategoryDto {
    return {
      id: row.id,
      slug: row.slug,
      label: row.label,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTagRow(row: TagRow): TagDto {
    return {
      id: row.id,
      slug: row.slug,
      label: row.label,
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
