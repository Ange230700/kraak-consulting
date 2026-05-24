import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ArticleDto } from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
import {
  validateCreateArticlePayload,
  validateUpdateArticlePayload,
} from './articles.dto';
import { ArticlesService } from './articles.service';

const publicationStatusEnum = ['draft', 'published', 'archived'];

const articleSchema = {
  type: 'object',
  required: [
    'id',
    'slug',
    'title',
    'excerpt',
    'content',
    'status',
    'coverImageUrl',
    'seoTitle',
    'seoDescription',
    'publishedAt',
    'authorId',
    'categoryIds',
    'tagIds',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
    excerpt: { type: 'string' },
    content: { type: 'string' },
    status: { type: 'string', enum: publicationStatusEnum },
    coverImageUrl: { type: 'string', nullable: true },
    seoTitle: { type: 'string', nullable: true },
    seoDescription: { type: 'string', nullable: true },
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
    authorId: { type: 'string' },
    categoryIds: { type: 'array', items: { type: 'string' } },
    tagIds: { type: 'array', items: { type: 'string' } },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const createArticleBodySchema = {
  type: 'object',
  required: [
    'slug',
    'title',
    'excerpt',
    'content',
    'status',
    'authorId',
    'categoryIds',
    'tagIds',
  ],
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    excerpt: { type: 'string' },
    content: { type: 'string' },
    status: { type: 'string', enum: publicationStatusEnum },
    coverImageUrl: { type: 'string', nullable: true },
    seoTitle: { type: 'string', nullable: true },
    seoDescription: { type: 'string', nullable: true },
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
    authorId: { type: 'string' },
    categoryIds: { type: 'array', items: { type: 'string' } },
    tagIds: { type: 'array', items: { type: 'string' } },
  },
};

const updateArticleBodySchema = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    excerpt: { type: 'string' },
    content: { type: 'string' },
    status: { type: 'string', enum: publicationStatusEnum },
    coverImageUrl: { type: 'string', nullable: true },
    seoTitle: { type: 'string', nullable: true },
    seoDescription: { type: 'string', nullable: true },
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
    authorId: { type: 'string' },
    categoryIds: { type: 'array', items: { type: 'string' } },
    tagIds: { type: 'array', items: { type: 'string' } },
  },
};

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

@ApiTags('Admin Articles')
@Controller('admin/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister tous les articles administrables' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des articles chargée avec succès.',
    schema: { type: 'array', items: articleSchema },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Session invalide.',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès admin requis.',
    schema: apiErrorSchema,
  })
  async listArticles(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ArticleDto[]> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.articlesService.listArticles(accessToken.data);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Récupérer un article par son identifiant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article chargé avec succès.',
    schema: articleSchema,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article introuvable.',
    schema: apiErrorSchema,
  })
  async getArticleById(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ArticleDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.articlesService.getArticleById(accessToken.data, id);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un article' })
  @ApiBody({ schema: createArticleBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Article créé avec succès.',
    schema: articleSchema,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payload invalide.',
    schema: apiErrorSchema,
  })
  async createArticle(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ArticleDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const validated = validateCreateArticlePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.articlesService.createArticle(accessToken.data, validated.data);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un article' })
  @ApiBody({ schema: updateArticleBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article mis à jour avec succès.',
    schema: articleSchema,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payload invalide.',
    schema: apiErrorSchema,
  })
  async updateArticle(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ArticleDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const validated = validateUpdateArticlePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.articlesService.updateArticle(
      accessToken.data,
      id,
      validated.data,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un article' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Article supprimé avec succès.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article introuvable.',
    schema: apiErrorSchema,
  })
  async deleteArticle(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    await this.articlesService.deleteArticle(accessToken.data, id);
  }
}
