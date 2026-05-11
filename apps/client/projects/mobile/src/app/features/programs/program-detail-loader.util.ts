import type { ActivatedRoute } from '@angular/router';
import type { WritableSignal } from '@angular/core';
import { logDebugError } from '@kraak/api-client';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import type { MobileProgramsService } from './mobile-programs.service';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';

export function readProgramId(route: ActivatedRoute): string | null {
  return route.snapshot.paramMap.get('programId');
}

export async function loadProgramDetailState(args: {
  programsService: MobileProgramsService;
  programId: string;
  loading: WritableSignal<boolean>;
  errorMessage: WritableSignal<string | null>;
  programDetail: WritableSignal<ParticipantProgramDetailDto | null>;
  fallbackMessage: string;
}): Promise<void> {
  const {
    programsService,
    programId,
    loading,
    errorMessage,
    programDetail,
    fallbackMessage,
  } = args;

  try {
    loading.set(true);
    errorMessage.set(null);
    const data = await programsService.getProgramDetail(programId);
    programDetail.set(data);
  } catch (error) {
    logDebugError('mobile.programs.detail.load', error, {
      feature: 'programs',
    });
    errorMessage.set(resolveAuthErrorMessage(error, fallbackMessage));
  } finally {
    loading.set(false);
  }
}
