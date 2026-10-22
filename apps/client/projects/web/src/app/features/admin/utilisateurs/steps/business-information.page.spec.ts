import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import BusinessInformationPage from './business-information.page';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../../shared/i18n';
import { UserFormStateService } from '../user-form-state.service';

describe('BusinessInformationPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [BusinessInformationPage],
      providers: [provideKraakI18n(), provideRouter([]), UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given existing state with a role, When ngOnInit is called, Then role field is populated', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({ role: 'trainer' });

    const fixture = TestBed.createComponent(BusinessInformationPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['role']).toBe('trainer');
  });

  it('Given roles constant, When roles list is accessed, Then 3 roles are provided', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    expect(fixture.componentInstance['roles']).toHaveLength(3);
  });

  it('Given a selected role, When sync is called, Then form state is updated', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(BusinessInformationPage);
    const comp = fixture.componentInstance;

    comp['role'] = 'admin';
    comp['sync']();

    expect(formState.state().role).toBe('admin');
  });

  it('Given current values, When goPrev is called, Then state is synced and previous route is requested', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const navigateSpy = vi
      .spyOn(comp['router'], 'navigate')
      .mockImplementation(async () => true);

    comp['role'] = 'trainer';
    comp['position'] = 'Coach';
    comp['department'] = 'Formation';

    comp['goPrev']();

    expect(formState.state().role).toBe('trainer');
    expect(formState.state().department).toBe('Formation');
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/basic-information',
    ]);
  });

  it('Given current values, When goNext is called, Then state is synced and next route is requested', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const navigateSpy = vi
      .spyOn(comp['router'], 'navigate')
      .mockImplementation(async () => true);

    comp['role'] = 'participant';
    comp['position'] = 'Apprenant';

    comp['goNext']();

    expect(formState.state().position).toBe('Apprenant');
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/location-information',
    ]);
  });

  it('Given step 2 is invalid, When template is rendered, Then the next button is disabled', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button',
    );
    const nextButton = buttons[1] as HTMLButtonElement | undefined;

    expect(nextButton).toBeTruthy();
    expect(nextButton?.disabled).toBe(true);
  });

  it('Given step 2 is valid, When template is rendered, Then the next button is enabled', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({ role: 'admin' });

    const fixture = TestBed.createComponent(BusinessInformationPage);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button',
    );
    const nextButton = buttons[1] as HTMLButtonElement | undefined;

    expect(nextButton).toBeTruthy();
    expect(nextButton?.disabled).toBe(false);
  });

  it('Given business fields, When user updates role and text inputs, Then form state is synced from ngModelChange handlers', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(BusinessInformationPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const roleSelect = host.querySelector('#role') as HTMLSelectElement;
    const positionInput = host.querySelector('#position') as HTMLInputElement;
    const departmentInput = host.querySelector(
      '#department',
    ) as HTMLInputElement;

    roleSelect.value = 'trainer';
    fixture.debugElement
      .query(By.css('#role'))
      .triggerEventHandler('change', { target: roleSelect });
    positionInput.value = 'Coach principal';
    fixture.debugElement
      .query(By.css('#position'))
      .triggerEventHandler('input', { target: positionInput });
    departmentInput.value = 'Programme';
    fixture.debugElement
      .query(By.css('#department'))
      .triggerEventHandler('input', { target: departmentInput });
    fixture.detectChanges();

    expect(formState.state().role).toBe('trainer');
    expect(formState.state().position).toBe('Coach principal');
    expect(formState.state().department).toBe('Programme');
  });

  it('Given English locale, When the step renders, Then it renders Business Information chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(BusinessInformationPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('Step 2 of 5');
    expect(text).toContain('Professional information');
    expect(text).toContain('Role');
    expect(text).toContain('Select a role…');
    expect(text).toContain('Participant');
    expect(text).toContain('Trainer');
    expect(text).toContain('Administrator');
    expect(text).toContain('Position / Job title');
    expect(text).toContain('Department / Team');
    expect(text).toContain('Previous');
    expect(text).toContain('Next');

    expect(
      (host.querySelector('#position') as HTMLInputElement).placeholder,
    ).toBe('E.g. Project manager');
  });
});
