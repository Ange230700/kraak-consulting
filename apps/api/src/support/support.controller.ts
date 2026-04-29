import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ContactSubmissionResultDto } from '@kraak/contracts';
import { extractAccessToken } from '../auth/auth.dto';
import { SupportService } from './support.service';
import { validateContactForm } from './support.dto';

@ApiTags('Support')
@Controller(['support/contact', 'contact'])
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Given une demande de contact/support valide
  // When le client soumet le formulaire
  // Then la réponse confirme la réception du message
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soumettre un formulaire de contact' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'subject', 'message'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 80 },
        email: { type: 'string', format: 'email' },
        subject: { type: 'string', minLength: 3, maxLength: 120 },
        message: { type: 'string', minLength: 10, maxLength: 2000 },
        category: {
          type: 'string',
          enum: ['technical', 'program', 'session', 'billing', 'other'],
          default: 'other',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message reçu avec succès',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        requestId: {
          type: 'string',
          nullable: true,
          description:
            'Identifiant de suivi, présent quand la demande est soumise avec une session authentifiée.',
        },
        requestStatus: {
          type: 'string',
          nullable: true,
          enum: ['open', 'in_progress', 'resolved', 'closed'],
          description:
            'Statut de suivi initial, présent quand la demande est tracée.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données de formulaire invalides',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async submit(
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
  ): Promise<ContactSubmissionResultDto> {
    const validation = validateContactForm(body);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        errors: validation.errors,
      });
    }

    const token = extractAccessToken(authorizationHeader);

    return this.supportService.submitContact(
      validation.data,
      token.valid ? token.data : undefined,
    );
  }
}
