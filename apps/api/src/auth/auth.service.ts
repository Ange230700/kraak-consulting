import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AppUserDto,
  AuthProfileDto,
  AuthSessionBundleDto,
  AuthSessionContextDto,
  AuthSessionTokensDto,
  ParticipantDto,
  PasswordResetRequestDto,
  PasswordResetResponseDto,
  RefreshSessionRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';

type AppUserRow = {
  id: string;
  email: string;
  role: AppUserDto['role'];
  first_name: string;
  last_name: string;
  phone: string | null;
  preferred_contact_channel: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  id: string;
  user_id: string;
  lifecycle_status: ParticipantDto['lifecycleStatus'];
  reference_code: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type SessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number | null;
  token_type: string;
};

type AuthUserPayload = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signIn(dto: SignInRequestDto): Promise<AuthSessionBundleDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException({
        success: false,
        message: 'Email ou mot de passe invalide.',
      });
    }

    return this.buildSessionBundle(
      data.user as AuthUserPayload,
      data.session as SessionPayload,
    );
  }

  async signUp(dto: SignUpRequestDto): Promise<SignUpResponseDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        emailRedirectTo: dto.redirectTo ?? undefined,
        data: {
          role: 'participant',
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone ?? undefined,
          preferred_contact_channel: dto.preferredContactChannel ?? undefined,
        },
      },
    });

    if (error || !data.user) {
      throw new BadRequestException({
        success: false,
        message: this.resolveSignUpErrorMessage(error?.message),
      });
    }

    const requiresEmailConfirmation = !data.session;

    return {
      message: requiresEmailConfirmation
        ? 'Votre compte a été créé. Vérifiez votre email pour confirmer votre accès.'
        : 'Votre compte est prêt. Vous êtes maintenant connecté.',
      requiresEmailConfirmation,
      session: data.session
        ? this.mapSession(data.session as SessionPayload)
        : null,
      profile: await this.readOptionalProfile(data.user.id),
    };
  }

  async refreshSession(
    dto: RefreshSessionRequestDto,
  ): Promise<AuthSessionBundleDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException({
        success: false,
        message: 'La session n’est plus valide. Veuillez vous reconnecter.',
      });
    }

    return this.buildSessionBundle(
      data.user as AuthUserPayload,
      data.session as SessionPayload,
    );
  }

  async requestPasswordReset(
    dto: PasswordResetRequestDto,
  ): Promise<PasswordResetResponseDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { error } = await authClient.auth.resetPasswordForEmail(dto.email, {
      redirectTo: dto.redirectTo ?? undefined,
    });

    if (error) {
      throw new BadRequestException({
        success: false,
        message: "Impossible d'envoyer l'email de réinitialisation.",
      });
    }

    return {
      success: true,
      message:
        'Si cette adresse existe, un email de réinitialisation vient d’être envoyé.',
    };
  }

  async getSession(accessToken: string): Promise<AuthSessionContextDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException({
        success: false,
        message: 'La session est invalide ou expirée.',
      });
    }

    return {
      profile: await this.readRequiredProfile(data.user as AuthUserPayload),
    };
  }

  private async buildSessionBundle(
    authUser: AuthUserPayload,
    session: SessionPayload,
  ): Promise<AuthSessionBundleDto> {
    return {
      session: this.mapSession(session),
      profile: await this.readRequiredProfile(authUser),
    };
  }

  private mapSession(session: SessionPayload): AuthSessionTokensDto {
    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : new Date(Date.now() + session.expires_in * 1000).toISOString();

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      expiresAt,
      tokenType: session.token_type,
    };
  }

  private async readRequiredProfile(
    authUser: AuthUserPayload,
  ): Promise<AuthProfileDto> {
    const profile = await this.readOptionalProfile(authUser.id);

    if (!profile) {
      await this.provisionMissingProfile(authUser);
      const provisionedProfile = await this.readOptionalProfile(authUser.id);

      if (provisionedProfile) {
        return provisionedProfile;
      }
    }

    if (!profile) {
      throw new NotFoundException({
        success: false,
        message: 'Le profil utilisateur est introuvable.',
      });
    }

    return profile;
  }

  private async provisionMissingProfile(
    authUser: AuthUserPayload,
  ): Promise<void> {
    const adminClient = this.supabaseService.getClient();
    const metadata =
      authUser.user_metadata && typeof authUser.user_metadata === 'object'
        ? authUser.user_metadata
        : {};
    const role = this.normalizeRole(metadata['role']);
    const email = this.readOptionalMetadataText(authUser.email) ?? authUser.id;
    const firstName =
      this.readOptionalMetadataText(metadata['first_name']) ??
      email.split('@')[0] ??
      'Participant';
    const lastName =
      this.readOptionalMetadataText(metadata['last_name']) ?? 'Participant';

    const { error } = await adminClient.from('app_user').upsert(
      {
        id: authUser.id,
        email,
        role,
        first_name: firstName,
        last_name: lastName,
        phone: this.readOptionalMetadataText(metadata['phone']),
        preferred_contact_channel: this.readOptionalMetadataText(
          metadata['preferred_contact_channel'],
        ),
      },
      { onConflict: 'id' },
    );

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: "Le profil utilisateur n'a pas pu être provisionné.",
      });
    }
  }

  private normalizeRole(value: unknown): AppUserDto['role'] {
    const normalized = this.readOptionalMetadataText(value)?.toLowerCase();

    if (
      normalized === 'participant' ||
      normalized === 'admin' ||
      normalized === 'trainer'
    ) {
      return normalized;
    }

    return 'participant';
  }

  private readOptionalMetadataText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private async readOptionalProfile(
    userId: string,
  ): Promise<AuthProfileDto | null> {
    const adminClient = this.supabaseService.getClient();
    const { data: appUserRow, error: appUserError } = await adminClient
      .from('app_user')
      .select(
        'id, email, role, first_name, last_name, phone, preferred_contact_channel, is_active, created_at, updated_at',
      )
      .eq('id', userId)
      .maybeSingle();

    if (appUserError) {
      throw new InternalServerErrorException({
        success: false,
        message: "Le profil utilisateur n'a pas pu être chargé.",
      });
    }

    if (!appUserRow) {
      return null;
    }

    const { data: participantRow, error: participantError } = await adminClient
      .from('participant')
      .select(
        'id, user_id, lifecycle_status, reference_code, country, city, notes, created_at, updated_at',
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (participantError) {
      throw new InternalServerErrorException({
        success: false,
        message: "Le profil participant n'a pas pu être chargé.",
      });
    }

    return {
      appUser: this.mapAppUser(appUserRow as AppUserRow),
      participant: participantRow
        ? this.mapParticipant(participantRow as ParticipantRow)
        : null,
    };
  }

  private mapAppUser(row: AppUserRow): AppUserDto {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      preferredContactChannel: row.preferred_contact_channel,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapParticipant(row: ParticipantRow): ParticipantDto {
    return {
      id: row.id,
      userId: row.user_id,
      lifecycleStatus: row.lifecycle_status,
      referenceCode: row.reference_code,
      country: row.country,
      city: row.city,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private resolveSignUpErrorMessage(rawMessage?: string): string {
    const message = rawMessage?.toLowerCase() ?? '';

    if (message.includes('already')) {
      return 'Un compte existe déjà pour cette adresse email.';
    }

    if (message.includes('password')) {
      return 'Le mot de passe ne respecte pas les exigences minimales.';
    }

    return 'Impossible de créer le compte avec ces informations.';
  }
}
