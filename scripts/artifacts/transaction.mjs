import { cp, mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

export async function renameDirectory(
  source,
  destination,
  { move = rename, platform = process.platform, pause = setTimeout } = {},
) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await move(source, destination);
      return;
    } catch (error) {
      console.warn('[docs:transaction] Renommage refusé.', error.code);
      if (
        platform !== 'win32' ||
        !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)
      )
        throw error;
      lastError = error;
      if (attempt < 4) await pause(100 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function directoryTransaction(
  destination,
  action,
  { preserveFailure = false, move = renameDirectory, inspect = stat } = {},
) {
  const parent = path.dirname(destination);
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(path.join(parent, '.artifact-stage-'));
  const backup = `${destination}.backup-${randomUUID()}`;
  let exists = false;
  let moved = false;
  try {
    try {
      exists = (await inspect(destination)).isDirectory();
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('[docs:transaction] Lecture impossible.', error);
        throw error;
      }
      console.debug('[docs:transaction] Nouveau dossier de sortie.');
    }
    if (exists) await cp(destination, temporary, { recursive: true });
    const result = await action(temporary);
    if (exists) {
      await move(destination, backup);
      moved = true;
    }
    try {
      await move(temporary, destination);
    } catch (error) {
      console.error(
        '[docs:transaction] Publication impossible, restauration.',
        error,
      );
      if (moved) {
        await move(backup, destination);
        moved = false;
      }
      throw error;
    }
    if (moved) await rm(backup, { recursive: true, force: true });
    return result;
  } catch (error) {
    console.error('[docs:transaction] Génération annulée.', error.message);
    if (preserveFailure) {
      const evidence = `${destination}.failed-${randomUUID()}`;
      await rename(temporary, evidence);
      console.error(`[docs:transaction] Preuves partielles : ${evidence}`);
    }
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}
