import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { vi } from 'vitest';
import AdminUserCreateLayoutPage from './admin-user-create-layout.page';
import { UserFormStateService } from './user-form-state.service';

describe('AdminUserCreateLayoutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserCreateLayoutPage],
      providers: [provideRouter([]), MessageService, UserFormStateService],
    }).compileComponents();
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
      label: 'Test',
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
      label: 'Informations de base',
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
      label: 'Localisation',
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
});
