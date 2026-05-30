import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiError } from '@kraak/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileSupportService } from './mobile-support.service';
import SupportRequestPage from './support-request.page';

describe('Mobile SupportRequestPage', () => {
  const supportService = {
    submitContactForm: vi.fn(),
  };

  let router: Router;
  let navigateByUrlSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    supportService.submitContactForm.mockReset();
    supportService.submitContactForm.mockResolvedValue({
      success: true,
      message: 'Votre demande a bien \u00E9t\u00E9 re\u00E7ue.',
    });

    await TestBed.configureTestingModule({
      imports: [SupportRequestPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: MobileSupportService, useValue: supportService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateByUrlSpy = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the Support stack, when the request page renders, then it keeps the expected mobile header', () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('ion-title');
    expect(title?.textContent).toContain('Nouvelle demande');
  });

  it('Given the support request form, when the page renders, then all form fields are visible', () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#support-name')).toBeTruthy();
    expect(element.querySelector('#support-email')).toBeTruthy();
    expect(element.querySelector('#support-category')).toBeTruthy();
    expect(element.querySelector('#support-subject')).toBeTruthy();
    expect(element.querySelector('#support-message')).toBeTruthy();
  });

  it('Given untouched empty fields, when the page renders, then inline validation messages are hidden', () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain(
      'Le nom est requis (2 à 80 caractères).',
    );
    expect(element.textContent).not.toContain(
      'Saisissez une adresse email valide.',
    );
    expect(element.textContent).not.toContain(
      "L'objet est requis (3 à 120 caractères).",
    );
    expect(element.textContent).not.toContain(
      'Le message est requis (10 à 2 000 caractères).',
    );
  });

  it('Given touched invalid fields, when the page renders, then all inline validation messages are displayed', () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.detectChanges();

    const { form } = fixture.componentInstance;
    form.controls.name.setValue('');
    form.controls.email.setValue('not-an-email');
    form.controls.subject.setValue('');
    form.controls.message.setValue('court');
    form.markAllAsTouched();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain(
      'Le nom est requis (2 à 80 caractères).',
    );
    expect(element.textContent).toContain(
      'Saisissez une adresse email valide.',
    );
    expect(element.textContent).toContain(
      "L'objet est requis (3 à 120 caractères).",
    );
    expect(element.textContent).toContain(
      'Le message est requis (10 à 2 000 caractères).',
    );
  });

  it('Given a submit in progress and an error message, when the page renders, then loading button label and error banner are shown', () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.detectChanges();

    fixture.componentInstance.submitting.set(true);
    fixture.componentInstance.errorMessage.set(
      'Une erreur test utilisateur est survenue.',
    );
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Envoi en cours...');
    expect(element.textContent).toContain(
      'Une erreur test utilisateur est survenue.',
    );
  });

  it('Given a fully valid form, when submit is called, then the support service is called with trimmed values and the app navigates back', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.componentInstance.form.setValue({
      name: '  Alice Dupont  ',
      email: '  alice@kraak.org  ',
      subject: 'Probl\u00E8me de connexion',
      message:
        'Je ne parviens pas \u00E0 acc\u00E9der \u00E0 mon espace participant.',
      category: 'technical',
    });

    await fixture.componentInstance.submit();

    expect(supportService.submitContactForm).toHaveBeenCalledWith({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Probl\u00E8me de connexion',
      message:
        'Je ne parviens pas \u00E0 acc\u00E9der \u00E0 mon espace participant.',
      category: 'technical',
    });
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/tabs/support');
  });

  it('Given an invalid form (empty fields), when submit is called, then the service is not called', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);

    await fixture.componentInstance.submit();

    expect(supportService.submitContactForm).not.toHaveBeenCalled();
  });

  it('Given a service error, when submit is called, then the error message is set and navigation does not occur', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new Error('Network error'),
    );

    fixture.componentInstance.form.setValue({
      name: 'Bob Martin',
      email: 'bob@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBeTruthy();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('Given an API validation error payload, when submit is called, then the backend message is surfaced to the user', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new ApiError(400, 'Bad Request', {
        errors: ['Le message doit contenir au moins 10 caract\u00E8res.'],
      }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Bob Martin',
      email: 'bob@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Le message doit contenir au moins 10 caract\u00E8res.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given a valid form that is already submitting, when submit is called again, then the service is not called a second time', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });
    fixture.componentInstance.submitting.set(true);

    await fixture.componentInstance.submit();

    expect(supportService.submitContactForm).not.toHaveBeenCalled();
  });

  it('Given an ApiError with a body message string, when submit is called, then the body message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new ApiError(422, 'Unprocessable Entity', {
        message:
          'Ce sujet a d\u00E9j\u00E0 \u00E9t\u00E9 soumis r\u00E9cemment.',
      }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Ce sujet a d\u00E9j\u00E0 \u00E9t\u00E9 soumis r\u00E9cemment.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError with a body errors string, when submit is called, then the errors string is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new ApiError(400, 'Bad Request', {
        errors: 'Formulaire invalide, veuillez v\u00E9rifier vos saisies.',
      }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Formulaire invalide, veuillez v\u00E9rifier vos saisies.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError with a body errors object, when submit is called, then field errors are joined and shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new ApiError(422, 'Unprocessable Entity', {
        errors: {
          email: ['Format d\u2019adresse e-mail invalide.'],
          name: 'Le nom est trop court.',
        },
      }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'Format d\u2019adresse e-mail invalide.',
    );
    expect(fixture.componentInstance.errorMessage()).toContain(
      'Le nom est trop court.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given a non-object error (null), when submit is called, then the generic fallback message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(null);

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Une erreur est survenue. Veuillez r\u00E9essayer ult\u00E9rieurement.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError with an errors object containing non-string non-array values, when submit is called, then only valid string messages are shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new ApiError(422, 'Unprocessable Entity', {
        errors: {
          metadata: { nested: 'ignoré' },
          name: 'Le nom est trop court.',
        },
      }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'Le nom est trop court.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError with an empty errors object, when submit is called, then the HTTP status message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    supportService.submitContactForm.mockRejectedValue(
      new ApiError(422, 'Unprocessable Entity', { errors: {} }),
    );

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      '422 Unprocessable Entity',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError 400 without usable body or message, when submit is called, then the invalid-form fallback message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    const apiError = new ApiError(400, '', { errors: {} });
    apiError.message = '   ';
    supportService.submitContactForm.mockRejectedValue(apiError);

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Les informations saisies sont invalides. Veuillez vérifier le formulaire.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError non-400 without usable body or message, when submit is called, then generic fallback message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    const apiError = new ApiError(422, '', { errors: {} });
    apiError.message = '   ';
    supportService.submitContactForm.mockRejectedValue(apiError);

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Une erreur est survenue. Veuillez réessayer ultérieurement.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError with errors array containing only blank or non-string values, when submit is called, then generic fallback message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    const apiError = new ApiError(500, '', {
      errors: ['   ', 42, null],
    });
    apiError.message = '   ';
    supportService.submitContactForm.mockRejectedValue(apiError);

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Une erreur est survenue. Veuillez réessayer ultérieurement.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('Given an ApiError body without errors field and no usable message, when submit is called, then generic fallback message is shown', async () => {
    const fixture = TestBed.createComponent(SupportRequestPage);
    const apiError = new ApiError(500, '', { message: '   ' });
    apiError.message = '   ';
    supportService.submitContactForm.mockRejectedValue(apiError);

    fixture.componentInstance.form.setValue({
      name: 'Alice Dupont',
      email: 'alice@kraak.org',
      subject: 'Question sur un programme',
      message: 'Quand commence la prochaine session de formation ?',
      category: 'program',
    });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Une erreur est survenue. Veuillez réessayer ultérieurement.',
    );
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });
});
