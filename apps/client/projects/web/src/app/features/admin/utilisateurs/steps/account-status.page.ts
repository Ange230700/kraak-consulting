import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import type { UserRoleValue } from '@kraak/contracts';

import { UserFormStateService } from '../user-form-state.service';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../../shared/i18n';

@Component({
  selector: 'kraak-account-status-step-page',
  standalone: true,
  imports: [FormsModule, ButtonDirective, Message, KraakTranslatePipe],
  templateUrl: './account-status.page.html',
})
export default class AccountStatusPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly formState = inject(UserFormStateService);
  private readonly i18n = inject(KraakI18nService);

  protected isActive = true;
  protected sendInvitation = true;
  protected errorMessage: string | null = null;

  ngOnInit(): void {
    const s = this.formState.state();
    this.isActive = s.isActive;
    this.sendInvitation = s.sendInvitation;
  }

  protected sync(): void {
    this.formState.patch({
      isActive: this.isActive,
      sendInvitation: this.sendInvitation,
    });
  }

  protected goPrev(): void {
    this.sync();
    void this.router.navigate(['/admin/utilisateurs/create/authorization']);
  }

  protected roleLabel(role: UserRoleValue | ''): string {
    switch (role) {
      case 'participant':
        return this.i18n.translate(
          'web.admin.users.create.businessInformation.roles.participant',
        );
      case 'trainer':
        return this.i18n.translate(
          'web.admin.users.create.businessInformation.roles.trainer',
        );
      case 'admin':
        return this.i18n.translate(
          'web.admin.users.create.businessInformation.roles.admin',
        );
      default:
        return '';
    }
  }
}
