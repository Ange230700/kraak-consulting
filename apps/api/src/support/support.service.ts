import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ContactFormDto,
  ContactSubmissionResultDto,
  SupportRequestDto,
  SupportRequestStatusValue,
  UpdateSupportRequestStatusDto,
} from '@kraak/contracts';
import { Resend } from 'resend';
import { SupabaseService } from '../supabase/supabase.service';

type UserRole = 'participant' | 'admin' | 'trainer';

type SessionUserContext = {
  userId: string;
  role: UserRole;
};

type SupportRequestRow = {
  id: string;
  user_id: string;
  participant_id: string | null;
  subject: string;
  message: string;
  status: SupportRequestStatusValue;
  category: ContactFormDto['category'];
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  id: string;
};

const allowedStatusTransitions: Record<
  SupportRequestStatusValue,
  SupportRequestStatusValue[]
> = {
  open: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async submitContact(
    dto: ContactFormDto,
    accessToken?: string,
  ): Promise<ContactSubmissionResultDto> {
    let trackingRequest: SupportRequestDto | null = null;

    if (accessToken) {
      trackingRequest = await this.createTrackedSupportRequest(
        dto,
        accessToken,
      );
    }

    await this.sendTransactionalEmail(dto);

    return {
      success: true,
      message:
        'Votre message a bien été reçu. Nous vous répondrons dans les plus brefs délais.',
      requestId: trackingRequest?.id,
      requestStatus: trackingRequest?.status,
    };
  }

  async listSupportRequests(accessToken: string): Promise<SupportRequestDto[]> {
    const sessionUser = await this.resolveSessionUser(accessToken);
    const adminClient = this.supabaseService.getClient();
    let query = adminClient
      .from('support_request')
      .select(
        'id, user_id, participant_id, subject, message, status, category, assigned_to_user_id, created_at, updated_at',
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (sessionUser.role === 'participant') {
      query = query.eq('user_id', sessionUser.userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les demandes de support.',
      });
    }

    return ((data as SupportRequestRow[] | null) ?? []).map((row) =>
      this.mapSupportRequest(row),
    );
  }

  async updateSupportRequestStatus(
    requestId: string,
    payload: UpdateSupportRequestStatusDto,
    accessToken: string,
  ): Promise<SupportRequestDto> {
    const sessionUser = await this.resolveSessionUser(accessToken);

    if (sessionUser.role === 'participant') {
      throw new ForbiddenException({
        success: false,
        message:
          "Vous ne pouvez pas modifier le statut d'une demande de support.",
      });
    }

    const adminClient = this.supabaseService.getClient();
    const { data: existing, error: readError } = await adminClient
      .from('support_request')
      .select(
        'id, user_id, participant_id, subject, message, status, category, assigned_to_user_id, created_at, updated_at',
      )
      .eq('id', requestId)
      .maybeSingle();

    if (readError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de lire la demande de support.',
      });
    }

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Demande de support introuvable.',
      });
    }

    const currentStatus = (existing as SupportRequestRow).status;

    if (currentStatus !== payload.status) {
      const nextAllowed = allowedStatusTransitions[currentStatus];

      if (!nextAllowed.includes(payload.status)) {
        throw new BadTransitionException(currentStatus, payload.status);
      }
    }

    const { data: updated, error: updateError } = await adminClient
      .from('support_request')
      .update({
        status: payload.status,
        assigned_to_user_id: sessionUser.userId,
      })
      .eq('id', requestId)
      .select(
        'id, user_id, participant_id, subject, message, status, category, assigned_to_user_id, created_at, updated_at',
      )
      .maybeSingle();

    if (updateError || !updated) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de mettre à jour le statut de la demande.',
      });
    }

    return this.mapSupportRequest(updated as SupportRequestRow);
  }

  private async createTrackedSupportRequest(
    dto: ContactFormDto,
    accessToken: string,
  ): Promise<SupportRequestDto> {
    const sessionUser = await this.resolveSessionUser(accessToken);
    const participantId = await this.resolveParticipantId(sessionUser.userId);
    const adminClient = this.supabaseService.getClient();

    const { data, error } = await adminClient
      .from('support_request')
      .insert({
        user_id: sessionUser.userId,
        participant_id: participantId,
        subject: dto.subject,
        message: dto.message,
        category: dto.category,
        status: 'open',
      })
      .select(
        'id, user_id, participant_id, subject, message, status, category, assigned_to_user_id, created_at, updated_at',
      )
      .maybeSingle();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message:
          'Votre demande a été reçue mais son suivi est indisponible pour le moment.',
      });
    }

    return this.mapSupportRequest(data as SupportRequestRow);
  }

  private async resolveSessionUser(
    accessToken: string,
  ): Promise<SessionUserContext> {
    const authClient = this.supabaseService.createAuthClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser(accessToken);

    if (authError || !authData.user) {
      throw new UnauthorizedException({
        success: false,
        message: 'La session est invalide ou expirée.',
      });
    }

    const adminClient = this.supabaseService.getClient();
    const { data: appUser, error: appUserError } = await adminClient
      .from('app_user')
      .select('id, role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (appUserError || !appUser) {
      throw new UnauthorizedException({
        success: false,
        message: 'Impossible de résoudre le profil utilisateur courant.',
      });
    }

    return {
      userId: authData.user.id,
      role: (appUser as { role: UserRole }).role,
    };
  }

  private async resolveParticipantId(userId: string): Promise<string | null> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('participant')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de résoudre le participant associé.',
      });
    }

    return (data as ParticipantRow | null)?.id ?? null;
  }

  private mapSupportRequest(row: SupportRequestRow): SupportRequestDto {
    return {
      id: row.id,
      userId: row.user_id,
      participantId: row.participant_id,
      subject: row.subject,
      message: row.message,
      status: row.status,
      category: row.category,
      assignedToUserId: row.assigned_to_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
      const result = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: dto.email,
        subject: `[KRAAK][${categoryLabel}] ${dto.subject}`,
        text: this.buildPlainTextBody(dto, categoryLabel),
      });

      // Le SDK Resend ne lève pas d'exception sur erreur API ;
      // il retourne `{ data, error }`. Sans ce contrôle, un envoi
      // refusé (clé invalide, domaine non vérifié, destinataire
      // interdit en mode sandbox, etc.) serait silencieusement
      // ignoré et l'utilisateur verrait quand même un succès.
      if (result.error) {
        this.logger.error(
          "Echec de l'envoi d'email transactionnel (Resend a retourné une erreur)",
          JSON.stringify(result.error),
        );

        throw new InternalServerErrorException({
          success: false,
          message:
            "Votre demande a été reçue, mais l'envoi de notification a échoué. Veuillez réessayer.",
        });
      }

      this.logger.log(
        `Email transactionnel envoyé via Resend (id=${result.data?.id ?? 'inconnu'}) vers ${toEmail}`,
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

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

class BadTransitionException extends ForbiddenException {
  constructor(
    fromStatus: SupportRequestStatusValue,
    toStatus: SupportRequestStatusValue,
  ) {
    super({
      success: false,
      message: `Transition de statut invalide: ${fromStatus} -> ${toStatus}.`,
    });
  }
}
