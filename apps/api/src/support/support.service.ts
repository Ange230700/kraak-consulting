import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ContactFormDto,
  ContactSubmissionResultDto,
} from '@kraak/contracts';
import { Resend } from 'resend';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly configService: ConfigService) {}

  async submitContact(
    dto: ContactFormDto,
  ): Promise<ContactSubmissionResultDto> {
    await this.sendTransactionalEmail(dto);

    return {
      success: true,
      message:
        'Votre message a bien été reçu. Nous vous répondrons dans les plus brefs délais.',
    };
  }

  private async sendTransactionalEmail(dto: ContactFormDto): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const toEmail = this.configService.get<string>('CONTACT_TO_EMAIL');
    const fromEmail =
      this.configService.get<string>('CONTACT_FROM_EMAIL') ??
      'onboarding@resend.dev';

    if (!apiKey || !toEmail) {
      this.logger.warn(
        'RESEND_API_KEY ou CONTACT_TO_EMAIL manquant — envoi transactionnel désactivé',
      );
      return;
    }

    const resend = new Resend(apiKey);
    const categoryLabel = this.getCategoryLabel(dto.category);

    try {
      await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: dto.email,
        subject: `[KRAAK][${categoryLabel}] ${dto.subject}`,
        text: this.buildPlainTextBody(dto, categoryLabel),
      });
    } catch (error) {
      this.logger.error(
        "Echec de l'envoi d'email transactionnel",
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        success: false,
        message:
          "Votre demande a été reçue, mais l'envoi de notification a échoué. Veuillez réessayer.",
      });
    }
  }

  private buildPlainTextBody(
    dto: ContactFormDto,
    categoryLabel: string,
  ): string {
    return [
      'Nouvelle demande de contact KRAAK',
      '',
      `Categorie: ${categoryLabel}`,
      `Nom: ${dto.name}`,
      `Email: ${dto.email}`,
      `Objet: ${dto.subject}`,
      '',
      'Message:',
      dto.message,
    ].join('\n');
  }

  private getCategoryLabel(category: ContactFormDto['category']): string {
    const labels: Record<ContactFormDto['category'], string> = {
      technical: 'Support technique',
      program: 'Programme',
      session: 'Session',
      billing: 'Facturation',
      other: 'Autre',
    };

    return labels[category];
  }
}
