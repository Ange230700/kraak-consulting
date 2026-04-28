import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { DashboardAggregateDto } from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
import { DashboardService } from './dashboard.service';

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
  },
};

const dashboardAggregateSchema = {
  type: 'object',
  required: [
    'generatedAt',
    'programs',
    'upcomingSessions',
    'recentAnnouncements',
  ],
  properties: {
    generatedAt: { type: 'string', format: 'date-time' },
    programs: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'enrollmentId',
          'programId',
          'slug',
          'title',
          'summary',
          'enrollmentStatus',
          'cohortId',
          'cohortName',
          'cohortStatus',
          'cohortStartDate',
        ],
        properties: {
          enrollmentId: { type: 'string' },
          programId: { type: 'string' },
          slug: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          enrollmentStatus: {
            type: 'string',
            enum: ['pending', 'active', 'completed', 'cancelled'],
          },
          cohortId: { type: 'string', nullable: true },
          cohortName: { type: 'string', nullable: true },
          cohortStatus: {
            type: 'string',
            nullable: true,
            enum: ['draft', 'planned', 'active', 'completed', 'archived'],
          },
          cohortStartDate: { type: 'string', nullable: true },
        },
      },
    },
    upcomingSessions: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'title',
          'status',
          'startsAt',
          'endsAt',
          'locationType',
          'locationLabel',
          'meetingLink',
          'cohortId',
          'cohortName',
          'programId',
          'programSlug',
          'programTitle',
        ],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: {
            type: 'string',
            enum: ['scheduled', 'live', 'completed', 'cancelled'],
          },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          locationType: {
            type: 'string',
            enum: ['online', 'onsite', 'hybrid'],
          },
          locationLabel: { type: 'string', nullable: true },
          meetingLink: { type: 'string', nullable: true },
          cohortId: { type: 'string' },
          cohortName: { type: 'string' },
          programId: { type: 'string' },
          programSlug: { type: 'string' },
          programTitle: { type: 'string' },
        },
      },
    },
    recentAnnouncements: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'title',
          'body',
          'audienceType',
          'programId',
          'cohortId',
          'publishedAt',
        ],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          audienceType: {
            type: 'string',
            enum: ['all_participants', 'program', 'cohort', 'custom'],
          },
          programId: { type: 'string', nullable: true },
          cohortId: { type: 'string', nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
};

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Récupérer les données agrégées du dashboard participant (programmes, sessions, annonces)',
  })
  @ApiResponse({
    status: 200,
    description: 'Agrégat dashboard chargé avec succès',
    schema: dashboardAggregateSchema,
  })
  @ApiResponse({
    status: 401,
    description: "Session invalide ou header d'autorisation manquant",
    schema: apiErrorSchema,
  })
  async getAggregate(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<DashboardAggregateDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.dashboardService.getAggregate(accessToken.data);
  }
}
