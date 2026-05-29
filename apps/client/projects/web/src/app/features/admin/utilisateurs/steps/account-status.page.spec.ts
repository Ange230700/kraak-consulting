import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { vi } from 'vitest';
import AccountStatusPage from './account-status.page';
import { UserFormStateService } from '../user-form-state.service';

describe('AccountStatusPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountStatusPage],
      providers: [provideRouter([]), MessageService, UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given default state, When ngOnInit is called, Then isActive is true and sendInvitation is true', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['isActive']).toBe(true);
    expect(fixture.componentInstance['sendInvitation']).toBe(true);
  });

  it('Given state with isActive false, When ngOnInit is called, Then isActive is false', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({ isActive: false });

    const fixture = TestBed.createComponent(AccountStatusPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['isActive']).toBe(false);
  });

  it('Given toggled values, When sync is called, Then state is updated', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);

    comp['isActive'] = false;
    comp['sendInvitation'] = false;
    comp['sync']();

    expect(formState.state().isActive).toBe(false);
    expect(formState.state().sendInvitation).toBe(false);
  });

  it('Given toggled values, When goPrev is called, Then state is synced and previous route is requested', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    comp['isActive'] = false;
    comp['sendInvitation'] = true;

    comp['goPrev']();

    expect(formState.state().isActive).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/authorization',
    ]);
  });

  it('Given an error message, When template is rendered, Then error feedback is displayed', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    const comp = fixture.componentInstance;
    comp['errorMessage'] = 'Erreur de validation';

    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Erreur de validation',
    );
  });

  it('Given no error message, When template is rendered, Then no error feedback is displayed', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent ?? '',
    ).not.toContain('Erreur de validation');
  });
});
