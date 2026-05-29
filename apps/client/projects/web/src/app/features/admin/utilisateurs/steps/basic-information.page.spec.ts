import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import BasicInformationPage from './basic-information.page';
import { UserFormStateService } from '../user-form-state.service';

describe('BasicInformationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicInformationPage],
      providers: [provideRouter([]), UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(BasicInformationPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given existing state, When ngOnInit is called, Then fields are populated from state', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
    });

    const fixture = TestBed.createComponent(BasicInformationPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['firstName']).toBe('Alice');
    expect(fixture.componentInstance['lastName']).toBe('Martin');
    expect(fixture.componentInstance['email']).toBe('alice@example.com');
  });

  it('Given form values are set, When sync is called, Then state service is updated', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(BasicInformationPage);
    const comp = fixture.componentInstance;

    comp['firstName'] = 'Bob';
    comp['lastName'] = 'Dupont';
    comp['email'] = 'bob@test.com';
    comp['sync']();

    expect(formState.state().firstName).toBe('Bob');
    expect(formState.state().lastName).toBe('Dupont');
    expect(formState.state().email).toBe('bob@test.com');
  });

  it('Given filled values, When goNext is called, Then state is synced and next route is requested', () => {
    const fixture = TestBed.createComponent(BasicInformationPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    comp['firstName'] = 'Alice';
    comp['lastName'] = 'Martin';
    comp['email'] = 'alice@example.com';
    comp['phone'] = '+243000000';

    comp['goNext']();

    expect(formState.state().firstName).toBe('Alice');
    expect(formState.state().phone).toBe('+243000000');
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/business-information',
    ]);
  });

  it('Given step 1 is invalid, When template is rendered, Then the next button is disabled', () => {
    const fixture = TestBed.createComponent(BasicInformationPage);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button.kr-button-primary',
    ) as HTMLButtonElement | null;

    expect(button).toBeTruthy();
    expect(button?.disabled).toBe(true);
  });

  it('Given step 1 is valid, When template is rendered, Then the next button is enabled', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
    });

    const fixture = TestBed.createComponent(BasicInformationPage);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button.kr-button-primary',
    ) as HTMLButtonElement | null;

    expect(button).toBeTruthy();
    expect(button?.disabled).toBe(false);
  });

  it('Given text fields in step 1, When user types, Then form state is synced from ngModelChange handlers', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(BasicInformationPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const firstNameInput = host.querySelector('#firstName') as HTMLInputElement;
    const lastNameInput = host.querySelector('#lastName') as HTMLInputElement;
    const emailInput = host.querySelector('#email') as HTMLInputElement;
    const phoneInput = host.querySelector('#phone') as HTMLInputElement;

    firstNameInput.value = 'Lina';
    firstNameInput.dispatchEvent(new Event('input'));
    lastNameInput.value = 'Nkosi';
    lastNameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'lina@example.com';
    emailInput.dispatchEvent(new Event('input'));
    phoneInput.value = '+243810000000';
    phoneInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(formState.state().firstName).toBe('Lina');
    expect(formState.state().lastName).toBe('Nkosi');
    expect(formState.state().email).toBe('lina@example.com');
    expect(formState.state().phone).toBe('+243810000000');
  });
});
