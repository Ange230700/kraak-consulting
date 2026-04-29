import { Injectable, inject } from '@angular/core';
import { createApiClient } from '@kraak/api-client';
import type {
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
} from '@kraak/contracts';
import { environment } from '../../../environments/environment';
import { MobileAuthService } from '../auth/mobile-auth.service';

@Injectable({
  providedIn: 'root',
})
export class MobileProgramsService {
  private readonly authService = inject(MobileAuthService);

  async listPrograms(): Promise<ParticipantProgramListItemDto[]> {
    const client = createApiClient({
      baseUrl: environment.apiBaseUrl,
      getAuthToken: () =>
        this.authService.currentSession()?.accessToken ?? null,
    });

    const programs = await client.programs.list();
    return programs as unknown as ParticipantProgramListItemDto[];
  }

  async getProgramDetail(
    programId: string,
  ): Promise<ParticipantProgramDetailDto> {
    const client = createApiClient({
      baseUrl: environment.apiBaseUrl,
      getAuthToken: () =>
        this.authService.currentSession()?.accessToken ?? null,
    });

    const detail = await client.programs.getById(programId);
    return detail as unknown as ParticipantProgramDetailDto;
  }
}
