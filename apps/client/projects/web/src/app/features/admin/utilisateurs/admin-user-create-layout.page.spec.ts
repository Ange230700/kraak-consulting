import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { vi } from 'vitest';
import AdminUserCreateLayoutPage from './admin-user-create-layout.page';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';
import { UserFormStateService } from './user-form-state.service';
import { WebAuthService } from '../../../core/auth/web-auth.service';

describe('AdminUserCreateLayoutPage', () => {
  it.each([null, {}, { accessToken: 'test-token' }])(
    'Given une session %j et une invitation valide, When le client réel est utilisé, Then le jeton et la langue sont transmis sans altérer le formulaire envoyé',
    async (session) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('{}', { status: 200 }));
      const auth = vi
        .spyOn(TestBed.inject(WebAuthService), 'currentSession')
        .mockReturnValue(
          session as ReturnType<WebAuthService['currentSession']>,
        );
      const navigate = vi
        .spyOn(TestBed.inject(Router), 'navigate')
        .mockResolvedValue(true);
      const page = TestBed.createComponent(
        AdminUserCreateLayoutPage,
      ).componentInstance;
      page.formState.patch({
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice@example.com',
        role: 'participant',
        sendInvitation: true,
      });
      await page.handleSubmit();
      expect(fetchMock).toHaveBeenCalledOnce();
      const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
      expect(headers.get('Authorization')).toBe(
        session && 'accessToken' in session ? 'Bearer test-token' : null,
      );
      expect(headers.get('Accept-Language')).toBe(
        TestBed.inject(KraakI18nService).locale(),
      );
      expect(
        JSON.parse(fetchMock.mock.calls[0][1]!.body as string),
      ).toMatchObject({ firstName: 'Alice', email: 'alice@example.com' });
      expect(navigate).toHaveBeenCalledWith(['/admin/utilisateurs/list']);
      fetchMock.mockRestore();
      auth.mockRestore();
      navigate.mockRestore();
    },
  );
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [AdminUserCreateLayoutPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        MessageService,
        UserFormStateService,
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the wizard steps, When steps are accessed, Then 5 steps are returned', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    expect(fixture.componentInstance.steps).toHaveLength(5);
  });

  it('Given a step with path "basic-information", When getStepRouterLink is called, Then returns correct admin URL', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const link = fixture.componentInstance.getStepRouterLink({
      labelKey: 'Test',
      icon: 'pi-user',
      path: 'basic-information',
    });
    expect(link).toBe('/admin/utilisateurs/create/basic-information');
  });

  it('Given incomplete form state, When submit is attempted, Then sets error message', async () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;

    await comp.handleSubmit();

    expect(comp['errorMessage']()).toBeTruthy();
  });

  it('Given invitation disabled, When submit is attempted, Then blocks submission with explicit message', async () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      role: 'participant',
      sendInvitation: false,
    });
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;

    await comp.handleSubmit();

    expect(comp['errorMessage']()).toContain('obligatoire');
  });

  it('Given a step matching current URL, When getStepButtonClass is called, Then active class is returned', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    vi.spyOn(comp['router'], 'url', 'get').mockReturnValue(
      '/admin/utilisateurs/create/basic-information',
    );

    const css = comp.getStepButtonClass({
      labelKey: 'Informations de base',
      icon: 'pi-user',
      path: 'basic-information',
    });

    expect(css).toContain('bg-brand-blue');
    expect(comp['currentStepIndex']()).toBe(0);
  });

  it('Given a non-current step, When getStepButtonClass is called, Then inactive class is returned', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    vi.spyOn(comp['router'], 'url', 'get').mockReturnValue(
      '/admin/utilisateurs/create/authorization',
    );

    const css = comp.getStepButtonClass({
      labelKey: 'Localisation',
      icon: 'pi-map-marker',
      path: 'location-information',
    });

    expect(css).toContain('text-neutral-600');
    expect(comp['currentStepIndex']()).toBe(3);
  });

  it('Given valid form data, When handleSubmit succeeds, Then invitation is sent, form is reset and navigation occurs', async () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const messageService = TestBed.inject(MessageService);
    const router = TestBed.inject(Router);

    const addSpy = vi.spyOn(messageService, 'add');
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      role: 'participant',
      phone: '000',
      preferredContactChannel: 'email',
      isActive: true,
      sendInvitation: true,
    });

    const createSpy = vi.fn().mockResolvedValue({ id: 'user-1' });
    Object.defineProperty(comp, 'usersClient', {
      value: { create: createSpy },
      configurable: true,
    });

    await comp.handleSubmit();

    expect(createSpy).toHaveBeenCalledWith({
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Martin',
      role: 'participant',
      phone: '000',
      preferredContactChannel: 'email',
      isActive: true,
    });
    expect(addSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/utilisateurs/list']);
    expect(formState.state().firstName).toBe('');
    expect(comp['submitting']()).toBe(false);
  });

  it('Given valid form data, When handleSubmit fails, Then error message is shown and submitting resets', async () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);

    formState.patch({
      firstName: 'Bob',
      lastName: 'Diallo',
      email: 'bob@example.com',
      role: 'admin',
      sendInvitation: true,
    });

    const createSpy = vi.fn().mockRejectedValue(new Error('network'));
    Object.defineProperty(comp, 'usersClient', {
      value: { create: createSpy },
      configurable: true,
    });

    await comp.handleSubmit();

    expect(createSpy).toHaveBeenCalled();
    expect(comp['errorMessage']()).toContain(
      "Impossible d'envoyer l'invitation",
    );
    expect(comp['submitting']()).toBe(false);
  });

  it('Given cancel action, When cancel is called, Then form resets and routes back to user list', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    formState.patch({
      firstName: 'Temp',
      email: 'temp@example.com',
      role: 'participant',
    });

    comp.cancel();

    expect(formState.state().firstName).toBe('');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/utilisateurs/list']);
  });

  it('Given form steps are invalid, When template is rendered, Then submit button is disabled', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    fixture.detectChanges();

    const submitButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.kr-button-primary',
    ) as HTMLButtonElement | null;

    expect(submitButton).toBeTruthy();
    expect(submitButton?.disabled).toBe(true);
  });

  it('Given form steps are valid and not submitting, When template is rendered, Then submit button is enabled', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);

    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      role: 'participant',
      sendInvitation: true,
    });

    comp['submitting'].set(false);
    fixture.detectChanges();

    const submitButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.kr-button-primary',
    ) as HTMLButtonElement | null;

    expect(submitButton).toBeTruthy();
    expect(submitButton?.disabled).toBe(false);
  });

  it('Given submitting state, When template is rendered, Then spinner is visible and submit button is disabled', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);

    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      role: 'participant',
      sendInvitation: true,
    });

    comp['submitting'].set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const submitButton = host.querySelector(
      'button.kr-button-primary',
    ) as HTMLButtonElement | null;
    const spinner = host.querySelector('.pi-spinner');

    expect(submitButton).toBeTruthy();
    expect(submitButton?.disabled).toBe(true);
    expect(spinner).toBeTruthy();
  });

  it('Given an explicit error message, When template is rendered, Then error feedback is visible', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;

    comp['errorMessage'].set('Erreur de soumission');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Erreur de soumission',
    );
  });

  it('Given English locale, When the create layout renders, Then it renders Create User wizard chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('Administration');
    expect(text).toContain('New user');
    expect(text).toContain('Invite a new member to join the KRAAK platform.');
    expect(text).toContain('Back to list');

    expect(text).toContain('Basic information');
    expect(text).toContain('Professional info');
    expect(text).toContain('Location');
    expect(text).toContain('Permissions');
    expect(text).toContain('Account status');

    expect(text).toContain('Cancel');
    expect(text).toContain('Send invitation');

    const navs = host.querySelectorAll('nav');

    expect(navs).toHaveLength(2);
    expect(navs[0]?.getAttribute('aria-label')).toBe('Creation steps');
    expect(navs[1]?.getAttribute('aria-label')).toBe('Creation steps');
  });
});
