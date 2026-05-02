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
});
