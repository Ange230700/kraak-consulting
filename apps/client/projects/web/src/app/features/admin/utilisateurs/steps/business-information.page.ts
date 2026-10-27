import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import type { UserRoleValue } from '@kraak/contracts';

import { UserFormStateService } from '../user-form-state.service';
import { KraakTranslatePipe } from '../../../../../../../shared/i18n';

const ROLES: { value: UserRoleValue; labelKey: string }[] = [
  {
    value: 'participant',
    labelKey: 'web.admin.users.create.businessInformation.roles.participant',
  },
  {
    value: 'trainer',
    labelKey: 'web.admin.users.create.businessInformation.roles.trainer',
  },
  {
    value: 'admin',
    labelKey: 'web.admin.users.create.businessInformation.roles.admin',
  },
];

@Component({
  selector: 'kraak-business-information-step-page',
  standalone: true,
  imports: [FormsModule, InputTextModule, ButtonDirective, KraakTranslatePipe],
  templateUrl: './business-information.page.html',
})
export default class BusinessInformationPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly formState = inject(UserFormStateService);

  protected readonly roles = ROLES;

  protected role: UserRoleValue | '' = '';
  protected position = '';
  protected department = '';

  ngOnInit(): void {
    const s = this.formState.state();
    this.role = s.role;
    this.position = s.position;
    this.department = s.department;
  }

  protected sync(): void {
    this.formState.patch({
      role: this.role,
      position: this.position,
      department: this.department,
    });
  }

  protected goPrev(): void {
    this.sync();
    void this.router.navigate(['/admin/utilisateurs/create/basic-information']);
  }

  protected goNext(): void {
    this.sync();
    void this.router.navigate([
      '/admin/utilisateurs/create/location-information',
    ]);
  }
}
