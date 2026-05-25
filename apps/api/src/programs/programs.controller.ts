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
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  MarkProgramSessionProgressResponseDto,
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
  ProgramDto,
} from '@kraak/contracts';
import { AuthService } from '../auth/auth.service';
import { extractAccessToken } from '../auth/auth.dto';
import { requireAdminAccess } from '../shared/admin-access.utils';
import {
  validateCreateProgramPayload,
  validateMarkSessionProgressPayload,
  validateUpdateProgramPayload,
} from './programs.dto';
import { ProgramsService } from './programs.service';

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

const programSchema = {
  type: 'object',
  required: [
    'id',
    'slug',
    'title',
    'summary',
    'description',
    'status',
    'visibility',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'published', 'archived'] },
    visibility: {
      type: 'string',
      enum: ['private', 'participants', 'public'],
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const cohortSchema = {
  type: 'object',
  nullable: true,
  required: [
    'id',
    'programId',
    'name',
    'code',
    'status',
    'startDate',
    'endDate',
    'capacity',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    programId: { type: 'string' },
    name: { type: 'string' },
    code: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: ['draft', 'open', 'active', 'completed', 'archived'],
    },
    startDate: { type: 'string' },
    endDate: { type: 'string', nullable: true },
    capacity: { type: 'integer', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const programListItemSchema = {
  type: 'object',
  required: [
    'enrollmentId',
    'enrollmentStatus',
    'program',
    'cohort',
    'progress',
  ],
  properties: {
    enrollmentId: { type: 'string' },
    enrollmentStatus: {
      type: 'string',
      enum: ['pending', 'active', 'completed', 'cancelled'],
    },
    program: programSchema,
    cohort: cohortSchema,
    progress: {
      type: 'object',
      required: [
        'totalSessions',
        'completedSessions',
        'completionRate',
        'status',
        'completedSessionIds',
        'updatedAt',
      ],
      properties: {
        totalSessions: { type: 'integer' },
        completedSessions: { type: 'integer' },
        completionRate: { type: 'integer' },
        status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'completed'],
        },
        completedSessionIds: { type: 'array', items: { type: 'string' } },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  },
};

const sessionSchema = {
  type: 'object',
  required: [
    'id',
    'cohortId',
    'title',
    'description',
    'status',
    'startsAt',
    'endsAt',
    'locationType',
    'locationLabel',
    'meetingLink',
    'trainerUserId',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    cohortId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
    },
    startsAt: { type: 'string', format: 'date-time' },
    endsAt: { type: 'string', format: 'date-time' },
    locationType: { type: 'string', enum: ['online', 'onsite', 'hybrid'] },
    locationLabel: { type: 'string', nullable: true },
    meetingLink: { type: 'string', nullable: true },
    trainerUserId: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const resourceSchema = {
  type: 'object',
  required: [
    'id',
    'programId',
    'cohortId',
    'title',
    'description',
    'resourceType',
    'url',
    'filePath',
    'status',
    'publishedAt',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    programId: { type: 'string', nullable: true },
    cohortId: { type: 'string', nullable: true },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    resourceType: {
      type: 'string',
      enum: ['link', 'file', 'video', 'document'],
    },
    url: { type: 'string', nullable: true },
    filePath: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['draft', 'published', 'archived'] },
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const announcementPreviewSchema = {
  type: 'object',
  required: ['id', 'title', 'audienceType', 'publishedAt'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    audienceType: {
      type: 'string',
      enum: ['all_participants', 'program', 'cohort', 'custom'],
    },
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const programDetailSchema = {
  type: 'object',
  required: [
    'enrollmentId',
    'enrollmentStatus',
    'program',
    'cohort',
    'progress',
    'sessions',
    'resources',
    'announcements',
  ],
  properties: {
    enrollmentId: { type: 'string' },
    enrollmentStatus: {
      type: 'string',
      enum: ['pending', 'active', 'completed', 'cancelled'],
    },
    program: programSchema,
    cohort: cohortSchema,
    progress: programListItemSchema.properties.progress,
    sessions: { type: 'array', items: sessionSchema },
    resources: { type: 'array', items: resourceSchema },
    announcements: { type: 'array', items: announcementPreviewSchema },
  },
};

const markProgressRequestSchema = {
  type: 'object',
  required: ['sessionId', 'completed'],
  properties: {
    sessionId: { type: 'string' },
    completed: { type: 'boolean' },
  },
};

const markProgressResponseSchema = {
  type: 'object',
  required: ['enrollmentId', 'enrollmentStatus', 'progress'],
  properties: {
    enrollmentId: { type: 'string' },
    enrollmentStatus: {
      type: 'string',
      enum: ['pending', 'active', 'completed', 'cancelled'],
    },
    progress: programListItemSchema.properties.progress,
  },
};

const createProgramBodySchema = {
  type: 'object',
  required: ['slug', 'title', 'summary', 'description', 'status', 'visibility'],
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'published', 'archived'] },
    visibility: {
      type: 'string',
      enum: ['private', 'participants', 'public'],
    },
  },
};

const updateProgramBodySchema = {
  type: 'object',
  properties: createProgramBodySchema.properties,
};

@ApiTags('Programs')
@Controller('programs')
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Lister les programmes publiés (public) avec filtrage participant optionnel',
  })
  @ApiResponse({
    status: 200,
    description:
      'Sans token: liste des programmes publiés. Avec token: liste participant enrichie (inscriptions/progression).',
    schema: {
      oneOf: [
        { type: 'array', items: programListItemSchema },
        { type: 'array', items: programSchema },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors du chargement des programmes',
    schema: apiErrorSchema,
  })
  async listPrograms(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ParticipantProgramListItemDto[] | ProgramDto[]> {
    if (!authorizationHeader) {
      return this.programsService.listPrograms();
    }

    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const session = await this.authService.getSession(accessToken.data);

    if (session.profile.appUser.role === 'admin') {
      return this.programsService.listAllPrograms();
    }

    return this.programsService.listPrograms(accessToken.data);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un programme' })
  @ApiBody({ schema: createProgramBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Programme créé avec succès',
    schema: programSchema,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payload invalide pour la création',
    schema: apiErrorSchema,
  })
  async createProgram(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ProgramDto> {
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateCreateProgramPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.programsService.createProgram(validated.data);
  }

  @Put(':programId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un programme' })
  @ApiBody({ schema: updateProgramBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Programme mis à jour avec succès',
    schema: programSchema,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payload invalide pour la mise à jour',
    schema: apiErrorSchema,
  })
  async updateProgram(
    @Param('programId') programId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ProgramDto> {
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateUpdateProgramPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.programsService.updateProgram(programId, validated.data);
  }

  @Patch(':programId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un programme (compatibilité PATCH)' })
  @ApiBody({ schema: updateProgramBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Programme mis à jour avec succès',
    schema: programSchema,
  })
  async patchProgram(
    @Param('programId') programId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ProgramDto> {
    return this.updateProgram(programId, body, authorizationHeader);
  }

  @Delete(':programId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archiver un programme' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Programme archivé avec succès',
  })
  async deleteProgram(
    @Param('programId') programId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.programsService.deleteProgram(programId);
  }

  @Get(':programId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Récupérer le détail d’un programme accessible au participant',
  })
  @ApiResponse({
    status: 200,
    description: 'Détail du programme chargé avec succès',
    schema: programDetailSchema,
  })
  @ApiResponse({
    status: 401,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Programme introuvable ou non accessible pour ce participant',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors du chargement du détail programme',
    schema: apiErrorSchema,
  })
  async getProgramDetail(
    @Param('programId') programId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ParticipantProgramDetailDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.programsService.getProgramDetail(accessToken.data, programId);
  }

  @Post(':programId/progress')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Marquer la progression minimale d’une session du programme',
  })
  @ApiBody({ schema: markProgressRequestSchema })
  @ApiResponse({
    status: 200,
    description: 'Progression mise à jour avec succès',
    schema: markProgressResponseSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide pour le marquage de progression',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 401,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Programme ou session introuvable pour ce participant',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors de la mise à jour de progression',
    schema: apiErrorSchema,
  })
  async markSessionProgress(
    @Param('programId') programId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<MarkProgramSessionProgressResponseDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const payload = validateMarkSessionProgressPayload(body);

    if (!payload.valid) {
      throw new BadRequestException({
        success: false,
        message: payload.errors.join(' '),
      });
    }

    return this.programsService.markSessionProgress(
      accessToken.data,
      programId,
      payload.data,
    );
  }
}
