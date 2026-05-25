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
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { extractAccessToken } from '../auth/auth.dto';
import { requireAdminAccess } from '../shared/admin-access.utils';
import {
  validateCreateUserPayload,
  validateUpdateUserPayload,
} from './users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer la liste de tous les utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs retournée' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — accès admin requis',
  })
  async findAll(@Headers('authorization') authHeader: string) {
    const token = extractAccessToken(authHeader);
    if (!token) throw new UnauthorizedException('Token manquant');
    await requireAdminAccess(this.authService, token);
    return this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer un utilisateur par son identifiant' })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'utilisateur",
    type: 'string',
  })
  @ApiResponse({ status: 200, description: 'Utilisateur retourné' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — accès admin requis',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = extractAccessToken(authHeader);
    if (!token) throw new UnauthorizedException('Token manquant');
    await requireAdminAccess(this.authService, token);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'utilisateur",
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string', enum: ['participant', 'admin', 'trainer'] },
        phone: { type: 'string', nullable: true },
        preferredContactChannel: { type: 'string', nullable: true },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — accès admin requis',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader: string,
  ) {
    const token = extractAccessToken(authHeader);
    if (!token) throw new UnauthorizedException('Token manquant');
    await requireAdminAccess(this.authService, token);

    const validation = validateUpdateUserPayload(body);
    if (!validation.valid) throw new BadRequestException(validation.error);

    return this.usersService.update(id, validation.data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'utilisateur",
    type: 'string',
  })
  @ApiResponse({ status: 204, description: 'Utilisateur supprimé' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — accès admin requis',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = extractAccessToken(authHeader);
    if (!token) throw new UnauthorizedException('Token manquant');
    await requireAdminAccess(this.authService, token);

    await this.usersService.remove(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inviter un nouvel utilisateur par email' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'firstName', 'lastName', 'role'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'alice@example.com',
        },
        firstName: { type: 'string', example: 'Alice' },
        lastName: { type: 'string', example: 'Martin' },
        role: { type: 'string', enum: ['participant', 'admin', 'trainer'] },
        phone: { type: 'string', nullable: true },
        preferredContactChannel: { type: 'string', nullable: true },
        isActive: { type: 'boolean', default: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation envoyée et profil créé',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — accès admin requis',
  })
  async invite(
    @Body() body: unknown,
    @Headers('authorization') authHeader: string,
  ) {
    const token = extractAccessToken(authHeader);
    if (!token) throw new UnauthorizedException('Token manquant');
    await requireAdminAccess(this.authService, token);

    const validation = validateCreateUserPayload(body);
    if (!validation.valid) throw new BadRequestException(validation.error);

    return this.usersService.invite(validation.data);
  }
}
