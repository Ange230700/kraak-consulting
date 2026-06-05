import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ArticleDto } from '@kraak/contracts';
import { articleSchema } from './articles.swagger';
import { ArticlesService } from './articles.service';

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
    description: 'Article public charge avec succès.',
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
