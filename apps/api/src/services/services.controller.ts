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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { requireAdminAccess } from '../shared/admin-access.utils';
import {
  type ServiceDetailDto,
  type ServiceDto,
  type ServiceWithDetailsDto,
  validateCreateServiceDetailPayload,
  validateCreateServicePayload,
  validateUpdateServiceDetailPayload,
  validateUpdateServicePayload,
} from './services.dto';
import { ServicesService } from './services.service';

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

const serviceSchema = {
  type: 'object',
  required: [
    'id',
    'title',
    'description',
    'sortOrder',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    icon: { type: 'string', nullable: true },
    sortOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const serviceDetailSchema = {
  type: 'object',
  required: [
    'id',
    'serviceId',
    'title',
    'description',
    'sortOrder',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    serviceId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    sortOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const serviceWithDetailsSchema = {
  type: 'object',
  required: [...serviceSchema.required, 'details'],
  properties: {
    ...serviceSchema.properties,
    details: {
      type: 'array',
      items: serviceDetailSchema,
    },
  },
};

const createServiceBodySchema = {
  type: 'object',
  required: ['title', 'description'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    icon: { type: 'string', nullable: true },
    sortOrder: { type: 'integer' },
  },
};

const updateServiceBodySchema = {
  type: 'object',
  properties: createServiceBodySchema.properties,
};

const createServiceDetailBodySchema = {
  type: 'object',
  required: ['title', 'description'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    sortOrder: { type: 'integer' },
  },
};

const updateServiceDetailBodySchema = {
  type: 'object',
  properties: createServiceDetailBodySchema.properties,
};

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les services' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des services triés par ordre d’affichage',
    schema: { type: 'array', items: serviceSchema },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur serveur lors du chargement des services',
    schema: apiErrorSchema,
  })
  async listServices(): Promise<ServiceDto[]> {
    return this.servicesService.listServices();
  }

  @Get(':serviceId')
  @ApiOperation({ summary: 'Récupérer un service avec ses détails' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service chargé avec ses détails',
    schema: serviceWithDetailsSchema,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service introuvable',
    schema: apiErrorSchema,
  })
  async getServiceById(
    @Param('serviceId') serviceId: string,
  ): Promise<ServiceWithDetailsDto> {
    return this.servicesService.getServiceById(serviceId);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un service' })
  @ApiBody({ schema: createServiceBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service créé avec succès',
    schema: serviceSchema,
  })
  async createService(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ServiceDto> {
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateCreateServicePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.servicesService.createService(validated.data);
  }

  @Put(':serviceId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un service' })
  @ApiBody({ schema: updateServiceBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service mis à jour avec succès',
    schema: serviceSchema,
  })
  async updateService(
    @Param('serviceId') serviceId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ServiceDto> {
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateUpdateServicePayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.servicesService.updateService(serviceId, validated.data);
  }

  @Patch(':serviceId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un service (compatibilité PATCH)' })
  @ApiBody({ schema: updateServiceBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service mis à jour avec succès',
    schema: serviceSchema,
  })
  async patchService(
    @Param('serviceId') serviceId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ServiceDto> {
    return this.updateService(serviceId, body, authorizationHeader);
  }

  @Delete(':serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un service' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Service supprimé avec succès',
  })
  async deleteService(
    @Param('serviceId') serviceId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.servicesService.deleteService(serviceId);
  }

  @Post(':serviceId/details')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un détail de service' })
  @ApiBody({ schema: createServiceDetailBodySchema })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Détail de service créé avec succès',
    schema: serviceDetailSchema,
  })
  async createServiceDetail(
    @Param('serviceId') serviceId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ServiceDetailDto> {
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateCreateServiceDetailPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.servicesService.createServiceDetail(serviceId, validated.data);
  }

  @Put(':serviceId/details/:detailId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un détail de service' })
  @ApiBody({ schema: updateServiceDetailBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Détail de service mis à jour avec succès',
    schema: serviceDetailSchema,
  })
  async updateServiceDetail(
    @Param('serviceId') serviceId: string,
    @Param('detailId') detailId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ServiceDetailDto> {
    await requireAdminAccess(this.authService, authorizationHeader);

    const validated = validateUpdateServiceDetailPayload(body);

    if (!validated.valid) {
      throw new BadRequestException({
        success: false,
        message: 'Payload invalide.',
        errors: validated.errors,
      });
    }

    return this.servicesService.updateServiceDetail(
      serviceId,
      detailId,
      validated.data,
    );
  }

  @Patch(':serviceId/details/:detailId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Mettre à jour un détail de service (compatibilité PATCH)',
  })
  @ApiBody({ schema: updateServiceDetailBodySchema })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Détail de service mis à jour avec succès',
    schema: serviceDetailSchema,
  })
  async patchServiceDetail(
    @Param('serviceId') serviceId: string,
    @Param('detailId') detailId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ServiceDetailDto> {
    return this.updateServiceDetail(
      serviceId,
      detailId,
      body,
      authorizationHeader,
    );
  }

  @Delete(':serviceId/details/:detailId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un détail de service' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Détail de service supprimé avec succès',
  })
  async deleteServiceDetail(
    @Param('serviceId') serviceId: string,
    @Param('detailId') detailId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<void> {
    await requireAdminAccess(this.authService, authorizationHeader);
    await this.servicesService.deleteServiceDetail(serviceId, detailId);
  }
}
