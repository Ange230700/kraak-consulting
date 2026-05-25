import {
  BadRequestException,
  Controller,
  Get,
  Body,
  Delete,
  Param,
  Query,
  Post,
  Put,
  Patch,
  HttpCode,
  HttpStatus,
  Headers,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type {
  ResourceAudienceValue,
  ResourceThemeValue,
  ResourceDto,
} from '@kraak/contracts';
import { AuthService } from '../auth/auth.service';
import { extractAccessToken } from '../auth/auth.dto';
import {
  validateCreateResourcePayload,
  validateUpdateResourcePayload,
} from './resources.dto';
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

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

const createResourceBodySchema = {
  type: 'object',
  required: [
    'title',
    'resourceType',
    'resourceTheme',
    'resourceAudience',
    'status',
  ],
  properties: {
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
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const updateResourceBodySchema = {
  type: 'object',
  properties: createResourceBodySchema.properties,
};

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly authService: AuthService,
  ) {}

  private async requireAdminAccess(
    authorizationHeader?: string,
  ): Promise<string> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const session = await this.authService.getSession(accessToken.data);

    if (session.profile.appUser.role !== 'admin') {
      throw new ForbiddenException({
        success: false,
        message: 'Accès admin requis.',
      });
    }

    return accessToken.data;
  }

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
    schema: apiErrorSchema,
  })
  async listResources(
    @Query('resourceTheme') resourceTheme?: ResourceThemeValue,
    @Query('resourceAudience') resourceAudience?: ResourceAudienceValue,
    @Query('programId') programId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Headers('authorization') authorizationHeader?: string,
  ) {
    if (authorizationHeader) {
      const accessToken = extractAccessToken(authorizationHeader);

      if (!accessToken.valid) {
        throw new UnauthorizedException({
          success: false,
          message: accessToken.error,
        });
      }

      const session = await this.authService.getSession(accessToken.data);

      if (session.profile.appUser.role === 'admin') {
        return this.resourcesService.listAllResources({
          resourceTheme,
          resourceAudience,
          programId,
          page,
          limit,
        });
      }
    }

    return this.resourcesService.listResources({
      resourceTheme,
      resourceAudience,
      programId,
      page,
      limit,
    });
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a resource' })
  @ApiBody({ schema: createResourceBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Resource created successfully',
    schema: RESOURCE_SCHEMA,
  })
  async createResource(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ResourceDto> {
    await this.requireAdminAccess(authorizationHeader);

    const validated = validateCreateResourcePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.resourcesService.createResource(validated.data);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiBody({ schema: updateResourceBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource updated successfully',
    schema: RESOURCE_SCHEMA,
  })
  async updateResource(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ResourceDto> {
    await this.requireAdminAccess(authorizationHeader);

    const validated = validateUpdateResourcePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.resourcesService.updateResource(id, validated.data);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a resource (compatibility PATCH)' })
  @ApiBody({ schema: updateResourceBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource updated successfully',
    schema: RESOURCE_SCHEMA,
  })
  async patchResource(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ResourceDto> {
    return this.updateResource(id, body, authorizationHeader);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archive a resource' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Resource archived successfully',
  })
  async deleteResource(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await this.requireAdminAccess(authorizationHeader);
    await this.resourcesService.deleteResource(id);
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
    schema: apiErrorSchema,
  })
  async getResourceById(@Param('id') id: string) {
    return this.resourcesService.getResourceById(id);
  }

  @Post(':id/consultations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track a resource consultation',
    description:
      'Record a consultation event for a published resource and update its tracking counters.',
  })
  @ApiParam({
    name: 'id',
    description: 'Resource ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Consultation recorded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found or not published',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error recording resource consultation',
    schema: apiErrorSchema,
  })
  async trackResourceConsultation(@Param('id') id: string): Promise<void> {
    await this.resourcesService.trackResourceConsultation(id);
  }
}
