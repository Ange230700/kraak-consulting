import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AppUserDto,
  CreateAppUserDto,
  UpdateAppUserDto,
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

const APP_USER_TABLE = 'app_user';
const notFoundSupabaseErrorCodes = new Set(['PGRST116']);

function mapRowToDto(row: AppUserRow): AppUserDto {
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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private readSupabaseErrorCode(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code;
    }

    return null;
  }

  async findAll(): Promise<AppUserDto[]> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from(APP_USER_TABLE)
      .select(
        'id, email, role, first_name, last_name, phone, preferred_contact_channel, is_active, created_at, updated_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(
        'Erreur lors de la récupération des utilisateurs',
        error,
      );
      throw new InternalServerErrorException(
        'Impossible de récupérer la liste des utilisateurs',
      );
    }

    return (data as AppUserRow[]).map(mapRowToDto);
  }

  async findOne(id: string): Promise<AppUserDto> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from(APP_USER_TABLE)
      .select(
        'id, email, role, first_name, last_name, phone, preferred_contact_channel, is_active, created_at, updated_at',
      )
      .eq('id', id)
      .single();

    if (
      error &&
      notFoundSupabaseErrorCodes.has(this.readSupabaseErrorCode(error) ?? '')
    ) {
      throw new NotFoundException(`Utilisateur introuvable : ${id}`);
    }
    if (error) {
      this.logger.error(
        `Erreur lors de la récupération de l'utilisateur ${id}`,
        error,
      );
      throw new InternalServerErrorException(
        "Impossible de récupérer l'utilisateur",
      );
    }
    if (!data) {
      throw new NotFoundException(`Utilisateur introuvable : ${id}`);
    }

    return mapRowToDto(data as AppUserRow);
  }

  async update(id: string, dto: UpdateAppUserDto): Promise<AppUserDto> {
    const client = this.supabaseService.getClient();

    const updateData: Record<string, unknown> = {};
    if (dto.email !== undefined) updateData['email'] = dto.email;
    if (dto.firstName !== undefined) updateData['first_name'] = dto.firstName;
    if (dto.lastName !== undefined) updateData['last_name'] = dto.lastName;
    if (dto.role !== undefined) updateData['role'] = dto.role;
    if (dto.phone !== undefined) updateData['phone'] = dto.phone;
    if (dto.preferredContactChannel !== undefined)
      updateData['preferred_contact_channel'] = dto.preferredContactChannel;
    if (dto.isActive !== undefined) updateData['is_active'] = dto.isActive;

    updateData['updated_at'] = new Date().toISOString();

    const { data, error } = await client
      .from(APP_USER_TABLE)
      .update(updateData)
      .eq('id', id)
      .select(
        'id, email, role, first_name, last_name, phone, preferred_contact_channel, is_active, created_at, updated_at',
      )
      .single();

    if (error || !data) {
      this.logger.error(
        `Erreur lors de la mise à jour de l'utilisateur ${id}`,
        error,
      );
      throw new InternalServerErrorException(
        "Impossible de mettre à jour l'utilisateur",
      );
    }

    return mapRowToDto(data as AppUserRow);
  }

  async remove(id: string): Promise<void> {
    const client = this.supabaseService.getClient();

    const existing = await client
      .from(APP_USER_TABLE)
      .select('id')
      .eq('id', id)
      .single();

    if (existing.error || !existing.data) {
      throw new NotFoundException(`Utilisateur introuvable : ${id}`);
    }

    const { error } = await client.from(APP_USER_TABLE).delete().eq('id', id);

    if (error) {
      this.logger.error(
        `Erreur lors de la suppression de l'utilisateur ${id}`,
        error,
      );
      throw new InternalServerErrorException(
        "Impossible de supprimer l'utilisateur",
      );
    }
  }

  async invite(dto: CreateAppUserDto): Promise<AppUserDto> {
    const client = this.supabaseService.getClient();

    const { data: authData, error: authError } =
      await client.auth.admin.inviteUserByEmail(dto.email, {
        data: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          role: dto.role,
        },
      });

    if (authError || !authData?.user) {
      this.logger.error(
        "Erreur lors de l'invitation de l'utilisateur",
        authError,
      );
      throw new InternalServerErrorException(
        "Impossible d'envoyer l'invitation",
      );
    }

    const userId = authData.user.id;

    const upsertResult = await client
      .from(APP_USER_TABLE)
      .upsert(
        {
          id: userId,
          email: dto.email,
          role: dto.role,
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone ?? null,
          preferred_contact_channel: dto.preferredContactChannel ?? null,
          is_active: dto.isActive ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select(
        'id, email, role, first_name, last_name, phone, preferred_contact_channel, is_active, created_at, updated_at',
      )
      .single();

    if (upsertResult.error || !upsertResult.data) {
      this.logger.error(
        'Erreur lors de la création du profil utilisateur',
        upsertResult.error,
      );
      throw new InternalServerErrorException(
        'Impossible de créer le profil utilisateur',
      );
    }

    return mapRowToDto(upsertResult.data as AppUserRow);
  }
}
