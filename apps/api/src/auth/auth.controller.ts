import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuthSessionBundleDto,
  AuthSessionContextDto,
  PasswordResetResponseDto,
  SignUpResponseDto,
} from '@kraak/contracts';
import {
  extractAccessToken,
  validatePasswordResetPayload,
  validateRefreshSessionPayload,
  validateSignInPayload,
  validateSignUpPayload,
} from './auth.dto';
import { AuthService } from './auth.service';

const apiErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'string' } },
  },
};

const appUserSchema = {
  type: 'object',
  required: [
    'id',
    'email',
    'role',
    'firstName',
    'lastName',
    'phone',
    'preferredContactChannel',
    'isActive',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['participant', 'admin', 'trainer'] },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    phone: { type: 'string', nullable: true },
    preferredContactChannel: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const participantSchema = {
  type: 'object',
  nullable: true,
  required: [
    'id',
    'userId',
    'lifecycleStatus',
    'referenceCode',
    'country',
    'city',
    'notes',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    lifecycleStatus: {
      type: 'string',
      enum: ['invited', 'registered', 'active', 'completed', 'inactive'],
    },
    referenceCode: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    city: { type: 'string', nullable: true },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const authProfileSchema = {
  type: 'object',
  required: ['appUser', 'participant'],
  properties: {
    appUser: appUserSchema,
    participant: participantSchema,
  },
};

const authSessionTokensSchema = {
  type: 'object',
  required: [
    'accessToken',
    'refreshToken',
    'expiresIn',
    'expiresAt',
    'tokenType',
  ],
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    expiresIn: { type: 'integer' },
    expiresAt: { type: 'string' },
    tokenType: { type: 'string', example: 'bearer' },
  },
};

const authSessionBundleSchema = {
  type: 'object',
  required: ['session', 'profile'],
  properties: {
    session: authSessionTokensSchema,
    profile: authProfileSchema,
  },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authentifier un participant avec email et mot de passe',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 128 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Session ouverte avec succès',
    schema: authSessionBundleSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de connexion invalides',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: "Erreur serveur lors de l'authentification",
    schema: apiErrorSchema,
  })
  signIn(@Body() body: unknown): Promise<AuthSessionBundleDto> {
    const validation = validateSignInPayload(body);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        errors: validation.errors,
      });
    }

    return this.authService.signIn(validation.data);
  }

  @Post('sign-up')
  @ApiOperation({ summary: 'Créer un compte participant MVP' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        firstName: { type: 'string', minLength: 1, maxLength: 80 },
        lastName: { type: 'string', minLength: 1, maxLength: 80 },
        phone: { type: 'string', nullable: true },
        preferredContactChannel: { type: 'string', nullable: true },
        redirectTo: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Compte créé ou confirmation email demandée',
    schema: {
      type: 'object',
      required: ['message', 'requiresEmailConfirmation', 'session', 'profile'],
      properties: {
        message: { type: 'string' },
        requiresEmailConfirmation: { type: 'boolean' },
        session: { ...authSessionTokensSchema, nullable: true },
        profile: { ...authProfileSchema, nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données d’inscription invalides',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors de la création du compte',
    schema: apiErrorSchema,
  })
  signUp(@Body() body: unknown): Promise<SignUpResponseDto> {
    const validation = validateSignUpPayload(body);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        errors: validation.errors,
      });
    }

    return this.authService.signUp(validation.data);
  }

  @Post('session/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renouveler une session à partir d’un refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Session renouvelée avec succès',
    schema: authSessionBundleSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Payload de refresh invalide',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Session expirée ou invalide',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors du renouvellement de session',
    schema: apiErrorSchema,
  })
  refreshSession(@Body() body: unknown): Promise<AuthSessionBundleDto> {
    const validation = validateRefreshSessionPayload(body);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        errors: validation.errors,
      });
    }

    return this.authService.refreshSession(validation.data);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclencher un email de réinitialisation de mot de passe',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
        redirectTo: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Demande de réinitialisation prise en compte',
    schema: {
      type: 'object',
      required: ['success', 'message'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload de réinitialisation invalide',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 429,
    description:
      'Trop de demandes de réinitialisation envoyées dans une fenêtre courte',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors de la demande de réinitialisation',
    schema: apiErrorSchema,
  })
  requestPasswordReset(
    @Body() body: unknown,
  ): Promise<PasswordResetResponseDto> {
    const validation = validatePasswordResetPayload(body);

    if (!validation.valid) {
      throw new BadRequestException({
        success: false,
        errors: validation.errors,
      });
    }

    return this.authService.requestPasswordReset(validation.data);
  }

  @Get('session')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Résoudre le profil de la session courante' })
  @ApiResponse({
    status: 200,
    description: 'Profil courant résolu avec succès',
    schema: {
      type: 'object',
      required: ['profile'],
      properties: {
        profile: authProfileSchema,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Session absente ou invalide',
    schema: apiErrorSchema,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur lors de la récupération de session',
    schema: apiErrorSchema,
  })
  getSession(
    @Headers('authorization') authorizationHeader: string | undefined,
  ): Promise<AuthSessionContextDto> {
    const tokenResult = extractAccessToken(authorizationHeader);

    if (!tokenResult.valid) {
      throw new UnauthorizedException({
        success: false,
        message: tokenResult.error,
      });
    }

    return this.authService.getSession(tokenResult.data);
  }
}
