import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Put,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ArticleDto, CategoryDto, TagDto } from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
import {
  validateCreateCategoryPayload,
  validateCreateTagPayload,
  validateCreateArticlePayload,
  validateUpdateCategoryPayload,
  validateUpdateTagPayload,
  validateUpdateArticlePayload,
} from './articles.dto';
import {
  articleSchema,
  createArticleBodySchema,
  updateArticleBodySchema,
} from './articles.swagger';
import { ArticlesService } from './articles.service';

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

const categoryResponseSchema = {
  type: 'object',
  required: ['id', 'slug', 'label', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    slug: { type: 'string' },
    label: { type: 'string' },
    description: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const categoryCreateBodySchema = {
  type: 'object',
  required: ['slug', 'label'],
  properties: {
    slug: { type: 'string' },
    label: { type: 'string' },
    description: { type: 'string', nullable: true },
  },
};

const categoryUpdateBodySchema = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    label: { type: 'string' },
    description: { type: 'string', nullable: true },
  },
};

const tagResponseSchema = {
  type: 'object',
  required: ['id', 'slug', 'label', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    slug: { type: 'string' },
    label: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const tagCreateBodySchema = {
  type: 'object',
  required: ['slug', 'label'],
  properties: {
    slug: { type: 'string' },
    label: { type: 'string' },
  },
};

const tagUpdateBodySchema = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    label: { type: 'string' },
  },
};

@ApiTags('Admin Articles')
@Controller('admin/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  private isCoverFile(value: unknown): value is {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as {
      originalname?: unknown;
      mimetype?: unknown;
      size?: unknown;
      buffer?: unknown;
    };

    return (
      typeof candidate.originalname === 'string' &&
      typeof candidate.mimetype === 'string' &&
      typeof candidate.size === 'number' &&
      Buffer.isBuffer(candidate.buffer)
    );
  }

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

  @Put(':id')
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

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un article (compatibilite PATCH)' })
  @ApiBody({ schema: updateArticleBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article mis a jour avec succes.',
    schema: articleSchema,
  })
  async patchArticle(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ArticleDto> {
    return this.updateArticle(id, body, authorizationHeader);
  }

  @Patch(':id/publish')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publier un article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article publie avec succes.',
    schema: articleSchema,
  })
  async publishArticle(
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

    return this.articlesService.publishArticle(accessToken.data, id);
  }

  @Post('cover-image')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Envoyer une image de couverture d'article" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Image de couverture envoyee.',
    schema: {
      type: 'object',
      required: ['url', 'path'],
      properties: {
        url: { type: 'string' },
        path: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCoverImage(
    @UploadedFile() file: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<{ url: string; path: string }> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    if (this.isCoverFile(file) === false) {
      throw new BadRequestException({
        success: false,
        message: 'Le fichier image est requis.',
      });
    }

    try {
      return await this.articlesService.uploadCoverImage(
        accessToken.data,
        file,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error("Échec de l'envoi de l'image de couverture article", {
        context: 'articles.uploadCoverImage',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      });

      throw new InternalServerErrorException({
        success: false,
        message: "Impossible d'envoyer l'image de couverture.",
      });
    }
  }

  @Get('categories')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories chargees avec succes.',
    schema: { type: 'array', items: categoryResponseSchema },
  })
  async listCategories(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CategoryDto[]> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.articlesService.listCategories(accessToken.data);
  }

  @Post('categories')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Creer une categorie' })
  @ApiBody({ schema: categoryCreateBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Categorie creee avec succes.',
    schema: categoryResponseSchema,
  })
  async createCategory(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CategoryDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const validated = validateCreateCategoryPayload(body);
    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.articlesService.createCategory(
      accessToken.data,
      validated.data,
    );
  }

  @Patch('categories/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre a jour une categorie' })
  @ApiBody({ schema: categoryUpdateBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categorie mise a jour avec succes.',
    schema: categoryResponseSchema,
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<CategoryDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const validated = validateUpdateCategoryPayload(body);
    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.articlesService.updateCategory(
      accessToken.data,
      id,
      validated.data,
    );
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver une categorie' })
  async deleteCategory(
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

    await this.articlesService.deleteCategory(accessToken.data, id);
  }

  @Get('tags')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les tags' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags charges avec succes.',
    schema: { type: 'array', items: tagResponseSchema },
  })
  async listTags(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TagDto[]> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.articlesService.listTags(accessToken.data);
  }

  @Post('tags')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Creer un tag' })
  @ApiBody({ schema: tagCreateBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tag cree avec succes.',
    schema: tagResponseSchema,
  })
  async createTag(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TagDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const validated = validateCreateTagPayload(body);
    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.articlesService.createTag(accessToken.data, validated.data);
  }

  @Patch('tags/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre a jour un tag' })
  @ApiBody({ schema: tagUpdateBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag mis a jour avec succes.',
    schema: tagResponseSchema,
  })
  async updateTag(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<TagDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const validated = validateUpdateTagPayload(body);
    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.articlesService.updateTag(accessToken.data, id, validated.data);
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver un tag' })
  async deleteTag(
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

    await this.articlesService.deleteTag(accessToken.data, id);
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
