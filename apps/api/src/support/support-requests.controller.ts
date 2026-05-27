import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { SupportRequestDto } from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
import { validateSupportStatusUpdatePayload } from './support.dto';
import { SupportService } from './support.service';

type SupportRequestWithReadDto = SupportRequestDto & { isRead: boolean };

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

const supportRequestSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'participantId',
    'subject',
    'message',
    'status',
    'category',
    'assignedToUserId',
    'isRead',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    participantId: { type: 'string', nullable: true },
    subject: { type: 'string' },
    message: { type: 'string' },
    status: {
      type: 'string',
      enum: ['open', 'in_progress', 'resolved', 'closed'],
    },
    category: {
      type: 'string',
      enum: ['technical', 'program', 'session', 'billing', 'other'],
    },
    assignedToUserId: { type: 'string', nullable: true },
    isRead: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

@ApiTags('Support')
@Controller('support/requests')
export class SupportRequestsController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les demandes de support et leur statut' })
  @ApiResponse({
    status: 200,
    description: 'Liste des demandes de support récupérée',
    schema: {
      type: 'array',
      items: supportRequestSchema,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Session invalide ou header Authorization manquant',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors du chargement des demandes de support',
    schema: apiErrorSchema,
  })
  async list(
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<SupportRequestWithReadDto[]> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.supportService.listSupportRequests(accessToken.data);
  }

  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: "Mettre à jour le statut d'une demande de support",
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'resolved', 'closed'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Statut mis à jour avec succès',
    schema: supportRequestSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Session invalide ou header Authorization manquant',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'Transition non autorisée ou droits insuffisants',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Demande introuvable',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors de la mise à jour du statut',
    schema: apiErrorSchema,
  })
  async updateStatus(
    @Param('id') requestId: string,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<SupportRequestWithReadDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    const payload = validateSupportStatusUpdatePayload(body);

    if (!payload.valid) {
      throw new BadRequestException({
        success: false,
        errors: payload.errors,
      });
    }

    return this.supportService.updateSupportRequestStatus(
      requestId,
      payload.data,
      accessToken.data,
    );
  }

  @Patch(':id/read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Marquer une demande de support comme lue" })
  @ApiResponse({
    status: 200,
    description: 'Demande marquée comme lue',
    schema: supportRequestSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Session invalide ou header Authorization manquant',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Demande introuvable',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors de la mise à jour',
    schema: apiErrorSchema,
  })
  async markAsRead(
    @Param('id') requestId: string,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<SupportRequestWithReadDto> {
    const accessToken = extractAccessToken(authorizationHeader);

    if (!accessToken.valid) {
      throw new UnauthorizedException({
        success: false,
        message: accessToken.error,
      });
    }

    return this.supportService.markSupportRequestAsRead(
      requestId,
      accessToken.data,
    );
  }
}
