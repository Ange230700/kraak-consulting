import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type {
  ResourceAudienceValue,
  ResourceThemeValue,
} from '@kraak/contracts';
import { ResourcesService } from './resources.service';

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List published resources with optional filtering',
    description:
      'Retrieve a paginated list of published resources. Supports filtering by theme and audience.',
  })
  @ApiQuery({
    name: 'resourceTheme',
    required: false,
    enum: ['training', 'project_management', 'immigration', 'career'],
    description: 'Filter by resource theme',
  })
  @ApiQuery({
    name: 'resourceAudience',
    required: false,
    enum: [
      'all',
      'young_professionals_students',
      'organizations',
      'international_candidates',
    ],
    description: 'Filter by resource audience',
  })
  @ApiQuery({
    name: 'programId',
    required: false,
    description: 'Filter by program ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based, default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of published resources',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
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
              resourceTheme: {
                type: 'string',
                enum: [
                  'training',
                  'project_management',
                  'immigration',
                  'career',
                ],
              },
              resourceAudience: {
                type: 'string',
                enum: [
                  'all',
                  'young_professionals_students',
                  'organizations',
                  'international_candidates',
                ],
              },
              url: { type: 'string', nullable: true },
              filePath: { type: 'string', nullable: true },
              status: {
                type: 'string',
                enum: ['draft', 'published', 'archived'],
              },
              publishedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error fetching resources',
  })
  async listResources(
    @Query('resourceTheme') resourceTheme?: ResourceThemeValue,
    @Query('resourceAudience') resourceAudience?: ResourceAudienceValue,
    @Query('programId') programId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.resourcesService.listResources({
      resourceTheme,
      resourceAudience,
      programId,
      page,
      limit,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single published resource by ID',
    description: 'Retrieve details of a specific published resource.',
  })
  @ApiParam({
    name: 'id',
    description: 'Resource ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource details',
    schema: {
      type: 'object',
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
        resourceTheme: {
          type: 'string',
          enum: ['training', 'project_management', 'immigration', 'career'],
        },
        resourceAudience: {
          type: 'string',
          enum: [
            'all',
            'young_professionals_students',
            'organizations',
            'international_candidates',
          ],
        },
        url: { type: 'string', nullable: true },
        filePath: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        publishedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found or not published',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error fetching resource',
  })
  async getResourceById(@Param('id') id: string) {
    return this.resourcesService.getResourceById(id);
  }
}
