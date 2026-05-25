import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';

import { UserFormStateService } from '../user-form-state.service';

@Component({
  selector: 'kraak-location-information-step-page',
  standalone: true,
  imports: [FormsModule, InputTextModule, ButtonDirective],
  templateUrl: './location-information.page.html',
})
export default class LocationInformationPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly formState = inject(UserFormStateService);

  protected country = '';
  protected city = '';
  protected postalCode = '';
  protected addressLine1 = '';
  protected addressLine2 = '';

  ngOnInit(): void {
    const s = this.formState.state();
    this.country = s.country;
    this.city = s.city;
    this.postalCode = s.postalCode;
    this.addressLine1 = s.addressLine1;
    this.addressLine2 = s.addressLine2;
  }

  protected sync(): void {
    this.formState.patch({
      country: this.country,
      city: this.city,
      postalCode: this.postalCode,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
    });
  }

  protected goPrev(): void {
    this.sync();
    void this.router.navigate([
      '/admin/utilisateurs/create/business-information',
    ]);
  }

  protected goNext(): void {
    this.sync();
    void this.router.navigate(['/admin/utilisateurs/create/authorization']);
  }
}
