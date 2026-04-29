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
  private readonly client = createApiClient({
    baseUrl: environment.apiBaseUrl,
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  });

  async listPrograms(): Promise<ParticipantProgramListItemDto[]> {
    return this.client.participantPrograms.list();
  }

  async getProgramDetail(
    programId: string,
  ): Promise<ParticipantProgramDetailDto> {
    return this.client.participantPrograms.getById(programId);
  }
}
