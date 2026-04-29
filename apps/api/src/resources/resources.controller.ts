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

const RESOURCE_THEME_ENUM = [
  'training',
  'project_management',
  'immigration',
  'career',
];

const RESOURCE_AUDIENCE_ENUM = [
  'all',
  'young_professionals_students',
  'organizations',
  'international_candidates',
];

const RESOURCE_TYPE_ENUM = ['link', 'file', 'video', 'document'];
const PUBLICATION_STATUS_ENUM = ['draft', 'published', 'archived'];

const RESOURCE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    programId: { type: 'string', nullable: true },
    cohortId: { type: 'string', nullable: true },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    resourceType: {
      type: 'string',
      enum: RESOURCE_TYPE_ENUM,
    },
    resourceTheme: {
      type: 'string',
      enum: RESOURCE_THEME_ENUM,
    },
    resourceAudience: {
      type: 'string',
      enum: RESOURCE_AUDIENCE_ENUM,
    },
    url: { type: 'string', nullable: true },
    filePath: { type: 'string', nullable: true },
    status: {
      type: 'string',
      enum: PUBLICATION_STATUS_ENUM,
    },
    publishedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const RESOURCE_LIST_SCHEMA = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: RESOURCE_SCHEMA,
    },
    total: { type: 'number' },
  },
};

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
    enum: RESOURCE_THEME_ENUM,
    description: 'Filter by resource theme',
  })
  @ApiQuery({
    name: 'resourceAudience',
    required: false,
    enum: RESOURCE_AUDIENCE_ENUM,
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
    schema: RESOURCE_LIST_SCHEMA,
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
    schema: RESOURCE_SCHEMA,
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
