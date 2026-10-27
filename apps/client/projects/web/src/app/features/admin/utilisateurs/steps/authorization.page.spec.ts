import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import AuthorizationPage from './authorization.page';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../../shared/i18n';
import { UserFormStateService } from '../user-form-state.service';

describe('AuthorizationPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [AuthorizationPage],
      providers: [provideKraakI18n(), provideRouter([]), UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(AuthorizationPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given existing state with notes, When ngOnInit is called, Then notes field is populated', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({
      notes: 'Note de test',
      preferredContactChannel: 'email',
    });

    const fixture = TestBed.createComponent(AuthorizationPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['notes']).toBe('Note de test');
    expect(fixture.componentInstance['preferredContactChannel']).toBe('email');
  });

  it('Given contact channels constant, When channels list is accessed, Then 3 channels are provided', () => {
    const fixture = TestBed.createComponent(AuthorizationPage);
    expect(fixture.componentInstance['contactChannels']).toHaveLength(3);
  });

  it('Given selected channel and notes, When sync is called, Then form state is updated', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(AuthorizationPage);
    const comp = fixture.componentInstance;

    comp['preferredContactChannel'] = 'whatsapp';
    comp['notes'] = 'Rappel le lundi';
    comp['sync']();

    expect(formState.state().preferredContactChannel).toBe('whatsapp');
    expect(formState.state().notes).toBe('Rappel le lundi');
  });

  it('Given selected values, When goPrev is called, Then state is synced and previous route is requested', () => {
    const fixture = TestBed.createComponent(AuthorizationPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    comp['preferredContactChannel'] = 'phone';
    comp['notes'] = 'Appeler le matin';

    comp['goPrev']();

    expect(formState.state().preferredContactChannel).toBe('phone');
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/location-information',
    ]);
  });

  it('Given selected values, When goNext is called, Then state is synced and next route is requested', () => {
    const fixture = TestBed.createComponent(AuthorizationPage);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    comp['preferredContactChannel'] = 'email';
    comp['notes'] = 'Niveau prioritaire';

    comp['goNext']();

    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/account-status',
    ]);
  });

  it('Given contact channels, When template is rendered, Then all selectable options are present', () => {
    const fixture = TestBed.createComponent(AuthorizationPage);
    fixture.detectChanges();

    const options = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '#preferredContactChannel option',
    );

    expect(options).toHaveLength(4);
  });

  it('Given English locale, When the step renders, Then it renders Authorization chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(AuthorizationPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('Step 4 of 5');
    expect(text).toContain('Permissions & preferences');
    expect(text).toContain('Preferred contact channel');
    expect(text).toContain('Select a channel…');
    expect(text).toContain('Email');
    expect(text).toContain('Phone');
    expect(text).toContain('WhatsApp');
    expect(text).toContain('Internal notes');
    expect(text).toContain('Previous');
    expect(text).toContain('Next');

    expect(
      (host.querySelector('#notes') as HTMLTextAreaElement).placeholder,
    ).toBe('Additional information for the team…');
  });
});
