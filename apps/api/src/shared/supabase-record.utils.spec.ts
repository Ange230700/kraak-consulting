import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { apiMessage } from '../i18n/api-message';
import type { SupabaseService } from '../supabase/supabase.service';
import {
  archivePublishedRecord,
  resolveParticipantId,
} from './supabase-record.utils';

function createStore(result: { data: unknown; error: unknown }) {
  const query = {
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
  const client = { from: jest.fn().mockReturnValue(query) };
  const service = {
    getClient: jest.fn().mockReturnValue(client),
  } as unknown as Pick<SupabaseService, 'getClient'>;
  return { query, client, service };
}

describe('archivePublishedRecord', () => {
  const message = apiMessage('programs.notFound');

  it('Given un contenu existant, When il est archivé, Then seul son statut est modifié et son identifiant est vérifié', async () => {
    const { service, client, query } = createStore({
      data: { id: 'record-1' },
      error: null,
    });

    await expect(
      archivePublishedRecord(service, 'program', 'record-1', message),
    ).resolves.toBeUndefined();

    expect(client.from).toHaveBeenCalledWith('program');
    expect(query.update).toHaveBeenCalledWith({ status: 'archived' });
    expect(query.eq).toHaveBeenCalledWith('id', 'record-1');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  it.each([
    { data: null, error: null },
    { data: null, error: { code: 'PGRST116' } },
    { data: { id: 'record-1' }, error: { code: '42501' } },
  ])(
    'Given un contenu absent ou une erreur ($error), When il est archivé, Then le message métier et le statut 404 sont conservés',
    async (result) => {
      const { service } = createStore(result);
      const operation = archivePublishedRecord(
        service,
        'lesson',
        'record-1',
        message,
      );

      await expect(operation).rejects.toBeInstanceOf(NotFoundException);
      await expect(operation).rejects.toMatchObject({
        response: { success: false, message },
      });
    },
  );
});

describe('resolveParticipantId', () => {
  const message = apiMessage('support.participantResolveFailed');

  it('Given un utilisateur participant, When son identifiant est résolu, Then la recherche utilise son utilisateur authentifié', async () => {
    const { service, client, query } = createStore({
      data: { id: 'participant-1' },
      error: null,
    });

    await expect(
      resolveParticipantId(service, 'user-1', message),
    ).resolves.toBe('participant-1');

    expect(client.from).toHaveBeenCalledWith('participant');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('Given un utilisateur sans participant, When son identifiant est résolu, Then aucun participant n’est retourné', async () => {
    const { service } = createStore({ data: null, error: null });

    await expect(
      resolveParticipantId(service, 'user-1', message),
    ).resolves.toBeNull();
  });

  it('Given une erreur de lecture, When le participant est résolu, Then le message métier et le statut 500 sont conservés', async () => {
    const { service } = createStore({
      data: null,
      error: { code: '42501' },
    });
    const operation = resolveParticipantId(service, 'user-1', message);

    await expect(operation).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    await expect(operation).rejects.toMatchObject({
      response: { success: false, message },
    });
  });
});
