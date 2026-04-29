import {
  Controller,
  Get,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
} from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
import { ProgramsService } from './programs.service';

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
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
  required: ['enrollmentId', 'enrollmentStatus', 'program', 'cohort'],
  properties: {
    enrollmentId: { type: 'string' },
    enrollmentStatus: {
      type: 'string',
      enum: ['pending', 'active', 'completed', 'cancelled'],
    },
    program: programSchema,
    cohort: cohortSchema,
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
    sessions: { type: 'array', items: sessionSchema },
    resources: { type: 'array', items: resourceSchema },
    announcements: { type: 'array', items: announcementPreviewSchema },
  },
};

@ApiTags('Programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Lister les programmes accessibles au participant connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des programmes accessible avec succès',
    schema: { type: 'array', items: programListItemSchema },
  })
  @ApiResponse({
    status: 401,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  async listPrograms(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ParticipantProgramListItemDto[]> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.programsService.listPrograms(accessToken.data);
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
}
