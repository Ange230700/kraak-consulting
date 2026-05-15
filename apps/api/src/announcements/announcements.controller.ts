import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { AnnouncementDto } from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
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
  constructor(private readonly announcementsService: AnnouncementsService) {}

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
}
