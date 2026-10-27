import { Component, inject, signal, computed } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';
import { createApiClient } from '@kraak/api-client';
import type { CreateAppUserDto } from '@kraak/contracts';

import { environment } from '../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { UserFormStateService } from './user-form-state.service';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
interface WizardStep {
  labelKey: string;
  icon: string;
  path: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    labelKey: 'web.admin.users.create.steps.basicInformation',
    icon: 'pi-user',
    path: 'basic-information',
  },
  {
    labelKey: 'web.admin.users.create.steps.businessInformation',
    icon: 'pi-briefcase',
    path: 'business-information',
  },
  {
    labelKey: 'web.admin.users.create.steps.locationInformation',
    icon: 'pi-map-marker',
    path: 'location-information',
  },
  {
    labelKey: 'web.admin.users.create.steps.authorization',
    icon: 'pi-key',
    path: 'authorization',
  },
  {
    labelKey: 'web.admin.users.create.steps.accountStatus',
    icon: 'pi-shield',
    path: 'account-status',
  },
];

@Component({
  selector: 'kraak-admin-user-create-layout-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ButtonDirective,
    Message,
    KraakTranslatePipe,
  ],
  templateUrl: './admin-user-create-layout.page.html',
})
export default class AdminUserCreateLayoutPage {
  protected readonly router = inject(Router);
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  readonly formState = inject(UserFormStateService);

  private readonly i18n = inject(KraakI18nService);
  private readonly usersClient = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).users;

  readonly steps = WIZARD_STEPS;

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly currentStepIndex = computed(() => {
    const url = this.router.url;
    const idx = WIZARD_STEPS.findIndex((s) => url.includes(s.path));
    return Math.max(idx, 0);
  });

  getStepRouterLink(step: WizardStep): string {
    return `/admin/utilisateurs/create/${step.path}`;
  }

  getStepButtonClass(step: WizardStep): string {
    const isActive = this.router.url.includes(step.path);
    if (isActive) {
      return 'flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium bg-brand-blue text-white shadow-sm transition-colors';
    }
    return 'flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors';
  }

  async handleSubmit(): Promise<void> {
    const state = this.formState.state();

    if (!this.formState.isStep1Valid() || !this.formState.isStep2Valid()) {
      this.errorMessage.set(
        this.i18n.translate(
          'web.admin.users.create.validation.incompleteSteps',
        ),
      );
      return;
    }
    if (!state.sendInvitation) {
      this.errorMessage.set(
        this.i18n.translate(
          'web.admin.users.create.validation.invitationRequired',
        ),
      );
      return;
    }

    const payload: CreateAppUserDto = {
      email: state.email,
      firstName: state.firstName,
      lastName: state.lastName,
      role: state.role as CreateAppUserDto['role'],
      phone: state.phone || null,
      preferredContactChannel: state.preferredContactChannel || null,
      isActive: state.isActive,
    };

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.usersClient.create(payload);
      this.formState.reset();
      this.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: this.i18n.translate(
          'web.admin.users.create.feedback.successSummary',
        ),
        detail: this.i18n.translate(
          'web.admin.users.create.feedback.successDetail',
          { email: payload.email },
        ),
      });
      await this.router.navigate(['/admin/utilisateurs/list']);
    } catch (err) {
      console.error(
        "[AdminUserCreateLayoutPage] Erreur lors de l'invitation",
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.users.create.feedback.failure'),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.formState.reset();
    void this.router.navigate(['/admin/utilisateurs/list']);
  }
}
