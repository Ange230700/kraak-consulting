import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';

import { UserFormStateService } from '../user-form-state.service';

@Component({
  selector: 'kraak-basic-information-step-page',
  standalone: true,
  imports: [FormsModule, InputTextModule, ButtonDirective],
  templateUrl: './basic-information.page.html',
})
export default class BasicInformationPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly formState = inject(UserFormStateService);

  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected phone = '';

  ngOnInit(): void {
    const s = this.formState.state();
    this.firstName = s.firstName;
    this.lastName = s.lastName;
    this.email = s.email;
    this.phone = s.phone;
  }

  protected sync(): void {
    this.formState.patch({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
    });
  }

  protected goNext(): void {
    this.sync();
    void this.router.navigate([
      '/admin/utilisateurs/create/business-information',
    ]);
  }
}
