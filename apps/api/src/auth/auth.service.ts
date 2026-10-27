import { ApiLocaleContext } from '../i18n/api-locale-context';
import {
  apiMessage,
  translateApiMessage,
  type ApiMessageValue,
} from '../i18n/api-message';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
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
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly localeContext: ApiLocaleContext,
  ) {}

  async signIn(dto: SignInRequestDto): Promise<AuthSessionBundleDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException({
        success: false,
        message: apiMessage('auth.invalidCredentials'),
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
      message: translateApiMessage(
        this.localeContext.locale(),
        apiMessage(
          requiresEmailConfirmation
            ? 'auth.signUpConfirmationRequired'
            : 'auth.signUpReady',
        ),
      ),
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
        message: apiMessage('auth.sessionNoLongerValid'),
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
      const errorCode =
        (error as { code?: string; error_code?: string }).code ??
        (error as { code?: string; error_code?: string }).error_code ??
        null;
      const isRateLimited =
        (error as { status?: number }).status === 429 ||
        errorCode === 'over_email_send_rate_limit' ||
        (error.message ?? '').toLowerCase().includes('rate limit');

      console.warn('[AuthService] Password reset request failed.', {
        status: (error as { status?: number }).status ?? null,
        code: errorCode,
        message: error.message ?? null,
      });

      if (isRateLimited) {
        throw new HttpException(
          {
            success: false,
            message: apiMessage('auth.passwordResetRateLimited'),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadRequestException({
        success: false,
        message: apiMessage('auth.passwordResetSendFailed'),
      });
    }

    return {
      success: true,
      message: translateApiMessage(
        this.localeContext.locale(),
        apiMessage('auth.passwordResetRequested'),
      ),
    };
  }

  async getSession(accessToken: string): Promise<AuthSessionContextDto> {
    const authClient = this.supabaseService.createAuthClient();
    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException({
        success: false,
        message: apiMessage('auth.sessionInvalidOrExpired'),
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
        message: apiMessage('auth.userProfileNotFound'),
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
        message: apiMessage('auth.userProfileProvisionFailed'),
      });
    }
  }

  private normalizeRole(value: unknown): AppUserDto['role'] {
    const normalized = this.readOptionalMetadataText(value)?.toLowerCase();

    if (
      normalized === 'participant' ||
      normalized === 'admin' ||
      normalized === 'trainer' ||
      normalized === 'employe'
    ) {
      // 'employe' is not yet in @kraak/contracts AppUserDto['role']; cast until contracts are updated
      return normalized as AppUserDto['role'];
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
        message: apiMessage('auth.userProfileLoadFailed'),
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
        message: apiMessage('auth.participantProfileLoadFailed'),
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

  private resolveSignUpErrorMessage(rawMessage?: string): ApiMessageValue {
    const message = rawMessage?.toLowerCase() ?? '';

    if (message.includes('already')) {
      return apiMessage('auth.signUpAccountExists');
    }

    if (message.includes('password')) {
      return apiMessage('auth.signUpPasswordRequirements');
    }

    if (message.includes('invalid') && message.includes('email')) {
      return apiMessage('auth.signUpEmailInvalid');
    }

    if (message.includes('rate') || message.includes('limit')) {
      return apiMessage('auth.signUpRateLimited');
    }

    return apiMessage('auth.signUpFailed');
  }
}
