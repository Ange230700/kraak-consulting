import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ContactSubmissionResultDto } from '@kraak/contracts';
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
  async submit(@Body() body: unknown): Promise<ContactSubmissionResultDto> {
    const validation = validateContactForm(body);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        errors: validation.errors,
      });
    }

    return this.supportService.submitContact(validation.data);
  }
}
