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
import { requireAdminAccess } from '../shared/admin-access.utils';
import {
  validateCreateResourcePayload,
  validateUpdateResourcePayload,
} from './resources.dto';
import {
  ResourcesService,
  type ResourceAccessContext,
} from './resources.service';
import { apiMessage } from '../i18n/api-message';

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

const resourceTypedProperties = {
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
};

const RESOURCE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    programId: { type: 'string', nullable: true },
    cohortId: { type: 'string', nullable: true },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    ...resourceTypedProperties,
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
    ...resourceTypedProperties,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les ressources explicitement publiques',
    description:
      "Retourne uniquement les ressources publiées d'audience « all » sans périmètre de programme ni de cohorte.",
  })
  @ApiQuery({
    name: 'resourceTheme',
    required: false,
    enum: RESOURCE_THEME_ENUM,
    description: 'Filtrer par thème de ressource',
  })
  @ApiQuery({
    name: 'resourceAudience',
    required: false,
    enum: RESOURCE_AUDIENCE_ENUM,
    description: 'Filtrer par audience de ressource',
  })
  @ApiQuery({
    name: 'programId',
    required: false,
    description: 'Filtrer par identifiant de programme',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (base 1, valeur par défaut : 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d’éléments par page (défaut : 20, maximum : 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des ressources publiques publiées',
    schema: RESOURCE_LIST_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur lors du chargement des ressources',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Session fournie invalide ou expirée',
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
    const accessContext =
      await this.getOptionalResourceAccessContext(authorizationHeader);

    if (accessContext?.role === 'admin' && accessContext.isActive) {
      return this.resourcesService.listAllResources({
        resourceTheme,
        resourceAudience,
        programId,
        page,
        limit,
      });
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
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateCreateResourcePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: apiMessage('validation.invalidPayload'),
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
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateUpdateResourcePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: apiMessage('validation.invalidPayload'),
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
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.resourcesService.deleteResource(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer une ressource publiée',
    description:
      "Les ressources sans programme ni cohorte et d'audience « all » sont publiques. Les autres ressources nécessitent une session autorisée selon leur périmètre.",
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de la ressource',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Détails de la ressource',
    schema: RESOURCE_SCHEMA,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ressource introuvable, non publiée ou non accessible',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Session fournie invalide ou expirée',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur lors du chargement de la ressource',
    schema: apiErrorSchema,
  })
  async getResourceById(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ) {
    const accessContext =
      await this.getOptionalResourceAccessContext(authorizationHeader);
    return this.resourcesService.getResourceById(id, accessContext);
  }

  @Post(':id/consultations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Enregistrer la consultation autorisée d’une ressource',
    description:
      'La consultation et la mise à jour des compteurs exigent une session active autorisée pour la ressource.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de la ressource',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Consultation enregistrée',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ressource introuvable, non publiée ou non accessible',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Session absente, invalide ou expirée',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur lors de l’enregistrement de la consultation',
    schema: apiErrorSchema,
  })
  async trackResourceConsultation(
    @Param('id') id: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    const accessContext =
      await this.getOptionalResourceAccessContext(authorizationHeader);

    if (!accessContext) {
      throw new UnauthorizedException({
        success: false,
        message: apiMessage('auth.bearerRequired'),
      });
    }

    await this.resourcesService.trackResourceConsultation(id, accessContext);
  }

  private async getOptionalResourceAccessContext(
    authorizationHeader?: string,
  ): Promise<ResourceAccessContext | undefined> {
    if (!authorizationHeader) {
      return undefined;
    }

    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const session = await this.authService.getSession(accessToken.data);
    const profile = session.profile;

    return {
      userId: profile.appUser.id,
      participantId: profile.participant?.id ?? null,
      role: profile.appUser.role,
      isActive: profile.appUser.isActive,
    };
  }
}
