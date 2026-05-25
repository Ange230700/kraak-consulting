import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { UserFormStateService } from '../user-form-state.service';

const CONTACT_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const;

@Component({
  selector: 'kraak-authorization-step-page',
  standalone: true,
  imports: [FormsModule, ButtonDirective],
  templateUrl: './authorization.page.html',
})
export default class AuthorizationPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly formState = inject(UserFormStateService);

  protected readonly contactChannels = CONTACT_CHANNELS;

  protected preferredContactChannel = '';
  protected notes = '';

  ngOnInit(): void {
    const s = this.formState.state();
    this.preferredContactChannel = s.preferredContactChannel;
    this.notes = s.notes;
  }

  protected sync(): void {
    this.formState.patch({
      preferredContactChannel: this.preferredContactChannel,
      notes: this.notes,
    });
  }

  protected goPrev(): void {
    this.sync();
    void this.router.navigate([
      '/admin/utilisateurs/create/location-information',
    ]);
  }

  protected goNext(): void {
    this.sync();
    void this.router.navigate(['/admin/utilisateurs/create/account-status']);
  }
}
