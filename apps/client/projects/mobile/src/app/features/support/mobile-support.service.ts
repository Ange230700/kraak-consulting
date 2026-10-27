import { inject, Injectable } from '@angular/core';
import { createApiClient } from '@kraak/api-client';
import type {
  ContactFormDto,
  ContactSubmissionResultDto,
  SupportRequestDto,
} from '@kraak/contracts';
import { environment } from '../../../environments/environment';
import { MobileAuthService } from '../../features/auth/mobile-auth.service';

import { KraakI18nService } from '../../../../../shared/i18n';
@Injectable({
  providedIn: 'root',
})
export class MobileSupportService {
  private readonly authService = inject(MobileAuthService);
  private readonly i18n = inject(KraakI18nService);
  private readonly client = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: environment.apiBaseUrl,
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  });

  submitContactForm(body: ContactFormDto): Promise<ContactSubmissionResultDto> {
    return this.client.contact.submit(body);
  }

  listMyRequests(): Promise<SupportRequestDto[]> {
    return this.client.contact.listMine();
  }
}
