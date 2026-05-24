import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ArticleDto } from '@kraak/contracts';
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

@ApiTags('Public Articles')
@Controller('articles')
export class ArticlesPublicController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les articles publics publies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste publique des articles publies.',
    schema: { type: 'array', items: articleSchema },
  })
  async listPublishedArticles(): Promise<ArticleDto[]> {
    return this.articlesService.listPublicArticles();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Afficher le detail public d un article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article public charge avec succes.',
    schema: articleSchema,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article introuvable.',
  })
  async getArticleBySlug(@Param('slug') slug: string): Promise<ArticleDto> {
    return this.articlesService.getPublicArticleBySlug(slug);
  }
}
