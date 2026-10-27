import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { ApiMessageValue } from '../i18n/api-message';
import type { SupabaseService } from '../supabase/supabase.service';

export async function archivePublishedRecord(
  supabaseService: Pick<SupabaseService, 'getClient'>,
  table: 'program' | 'course' | 'learning_module' | 'chapter' | 'lesson',
  id: string,
  notFoundMessage: ApiMessageValue,
): Promise<void> {
  const { data, error } = await supabaseService
    .getClient()
    .from(table)
    .update({ status: 'archived' })
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    throw new NotFoundException({
      success: false,
      message: notFoundMessage,
    });
  }
}

export async function resolveParticipantId(
  supabaseService: Pick<SupabaseService, 'getClient'>,
  userId: string,
  loadFailedMessage: ApiMessageValue,
): Promise<string | null> {
  const { data, error } = await supabaseService
    .getClient()
    .from('participant')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new InternalServerErrorException({
      success: false,
      message: loadFailedMessage,
    });
  }

  return (data as { id: string } | null)?.id ?? null;
}
