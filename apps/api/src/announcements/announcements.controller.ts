import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  Post,
  Put,
  Patch,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { AnnouncementDto } from '@kraak/contracts';
import { AuthService } from '../auth/auth.service';
import { extractAccessToken } from '../auth/auth.dto';
import { requireAdminAccess } from '../shared/admin-access.utils';
import {
  validateCreateAnnouncementPayload,
  validateUpdateAnnouncementPayload,
} from './announcements.dto';
import { AnnouncementsService } from './announcements.service';

const ANNOUNCEMENT_PRIORITY_ENUM = ['low', 'normal', 'high', 'critical'];
const AUDIENCE_TYPE_ENUM = ['all_participants', 'program', 'cohort'];
const PUBLICATION_STATUS_ENUM = ['draft', 'published', 'archived'];

const ANNOUNCEMENT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    priority: {
      type: 'string',
      enum: ANNOUNCEMENT_PRIORITY_ENUM,
    },
    audienceType: {
      type: 'string',
      enum: AUDIENCE_TYPE_ENUM,
    },
    programId: { type: 'string', nullable: true },
    cohortId: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: PUBLICATION_STATUS_ENUM,
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
    },
    createdByUserId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const ANNOUNCEMENT_LIST_SCHEMA = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: ANNOUNCEMENT_SCHEMA,
    },
    total: { type: 'number' },
  },
};

const ANNOUNCEMENT_BODY_SCHEMA = {
  type: 'object',
  required: ['title', 'body', 'audienceType'],
  properties: {
    title: { type: 'string' },
    body: { type: 'string' },
    priority: {
      type: 'string',
      enum: ANNOUNCEMENT_PRIORITY_ENUM,
    },
    audienceType: {
      type: 'string',
      enum: AUDIENCE_TYPE_ENUM,
    },
    programId: { type: 'string', nullable: true },
    cohortId: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: PUBLICATION_STATUS_ENUM,
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
    },
  },
};

const ANNOUNCEMENT_UPDATE_BODY_SCHEMA = {
  type: 'object',
  properties: ANNOUNCEMENT_BODY_SCHEMA.properties,
};

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lister les annonces publiées (public) avec filtrage participant optionnel',
    description:
      "Récupère une liste paginée d'annonces publiées. Sans token: retourne toutes les annonces publiées. Avec token valide: filtre selon le périmètre du participant (all_participants, program, cohort).",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (base 1, défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'articles par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des annonces accessibles au participant',
    schema: ANNOUNCEMENT_LIST_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur serveur lors du chargement des annonces',
    schema: apiErrorSchema,
  })
  async listAnnouncements(
    @Headers('authorization') authorizationHeader?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: AnnouncementDto[]; total: number }> {
    if (!authorizationHeader) {
      return this.announcementsService.listAnnouncements(
        undefined,
        page,
        limit,
      );
    }

    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.announcementsService.listAnnouncements(
      accessToken.data,
      page,
      limit,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: "Récupérer le détail d'une annonce",
    description:
      "Récupère les détails d'une annonce publiée spécifique, à condition que le participant ait accès à cette annonce selon son périmètre d'inscription.",
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'annonce",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Détails de l'annonce",
    schema: ANNOUNCEMENT_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Annonce non trouvée ou non accessible',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Erreur serveur lors du chargement de l'annonce",
    schema: apiErrorSchema,
  })
  async getAnnouncementById(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<AnnouncementDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.announcementsService.getAnnouncementById(id, accessToken.data);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une annonce' })
  @ApiBody({ schema: ANNOUNCEMENT_BODY_SCHEMA })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Annonce créée avec succès',
    schema: ANNOUNCEMENT_SCHEMA,
  })
  async createAnnouncement(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<AnnouncementDto> {
    const accessToken = await requireAdminAccess(
      this.authService,
      authorizationHeader,
    );
    const validated = validateCreateAnnouncementPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    const session = await this.authService.getSession(accessToken);

    return this.announcementsService.createAnnouncement(
      validated.data,
      session.profile.appUser.id,
    );
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  @ApiBody({ schema: ANNOUNCEMENT_UPDATE_BODY_SCHEMA })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Annonce mise à jour avec succès',
    schema: ANNOUNCEMENT_SCHEMA,
  })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<AnnouncementDto> {
    await requireAdminAccess(this.authService, authorizationHeader);
    const validated = validateUpdateAnnouncementPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.announcementsService.updateAnnouncement(id, validated.data);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour une annonce (compatibilité PATCH)' })
  @ApiBody({ schema: ANNOUNCEMENT_UPDATE_BODY_SCHEMA })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Annonce mise à jour avec succès',
    schema: ANNOUNCEMENT_SCHEMA,
  })
  async patchAnnouncement(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<AnnouncementDto> {
    return this.updateAnnouncement(id, body, authorizationHeader);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une annonce' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Annonce supprimée avec succès',
  })
  async deleteAnnouncement(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.announcementsService.deleteAnnouncement(id);
  }
}
