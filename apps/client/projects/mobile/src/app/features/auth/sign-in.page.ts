import { Component, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { createSignInForm, submitSignInForm } from '@kraak/api-client';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { MobileAuthService } from './mobile-auth.service';

@Component({
  selector: 'kraak-sign-in-page',
  standalone: true,
  imports: [PageShellComponent, ReactiveFormsModule, RouterLink, IonButton],
  templateUrl: './sign-in.page.html',
})
export default class SignInPage {
  private readonly authService = inject(MobileAuthService);
  private readonly router = inject(Router);

  readonly form = createSignInForm();
  readonly templateFormGroup = this.form as unknown as FormGroup;
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  async submit(): Promise<void> {
    await submitSignInForm({
      form: this.form,
      isSubmitting: this.submitting,
      setSubmitting: this.submitting.set,
      setErrorMessage: this.errorMessage.set,
      signIn: this.authService.signIn.bind(this.authService),
      navigateAfterSuccess: () => this.router.navigateByUrl('/tabs/accueil'),
      logContext: 'mobile.auth.sign-in.submit',
      route: '/connexion',
    });
  }
}
