import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import LocationInformationPage from './location-information.page';
import { UserFormStateService } from '../user-form-state.service';

describe('LocationInformationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationInformationPage],
      providers: [provideRouter([]), UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(LocationInformationPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given existing location state, When ngOnInit is called, Then fields are populated', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({ country: 'RDC', city: 'Kinshasa' });

    const fixture = TestBed.createComponent(LocationInformationPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['country']).toBe('RDC');
    expect(fixture.componentInstance['city']).toBe('Kinshasa');
  });

  it('Given location values, When sync is called, Then form state is updated', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(LocationInformationPage);
    const comp = fixture.componentInstance;

    comp['country'] = 'France';
    comp['city'] = 'Paris';
    comp['sync']();

    expect(formState.state().country).toBe('France');
    expect(formState.state().city).toBe('Paris');
  });

  it('Given location values, When goPrev is called, Then state is synced and previous route is requested', () => {
    const fixture = TestBed.createComponent(LocationInformationPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    comp['country'] = 'RDC';
    comp['city'] = 'Kinshasa';
    comp['addressLine1'] = '12 Avenue de la Paix';

    comp['goPrev']();

    expect(formState.state().addressLine1).toBe('12 Avenue de la Paix');
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/business-information',
    ]);
  });

  it('Given location values, When goNext is called, Then state is synced and next route is requested', () => {
    const fixture = TestBed.createComponent(LocationInformationPage);
    const comp = fixture.componentInstance;
    const formState = TestBed.inject(UserFormStateService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(async () => true);

    comp['postalCode'] = '00243';
    comp['addressLine2'] = 'B3';

    comp['goNext']();

    expect(formState.state().postalCode).toBe('00243');
    expect(formState.state().addressLine2).toBe('B3');
    expect(navigateSpy).toHaveBeenCalledWith([
      '/admin/utilisateurs/create/authorization',
    ]);
  });

  it('Given location fields, When user types in inputs, Then form state is synced from ngModelChange handlers', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(LocationInformationPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const countryInput = host.querySelector('#country') as HTMLInputElement;
    const cityInput = host.querySelector('#city') as HTMLInputElement;
    const postalCodeInput = host.querySelector(
      '#postalCode',
    ) as HTMLInputElement;
    const address1Input = host.querySelector(
      '#addressLine1',
    ) as HTMLInputElement;
    const address2Input = host.querySelector(
      '#addressLine2',
    ) as HTMLInputElement;

    countryInput.value = 'RDC';
    countryInput.dispatchEvent(new Event('input'));
    cityInput.value = 'Lubumbashi';
    cityInput.dispatchEvent(new Event('input'));
    postalCodeInput.value = '00001';
    postalCodeInput.dispatchEvent(new Event('input'));
    address1Input.value = '10 Avenue Kasa-Vubu';
    address1Input.dispatchEvent(new Event('input'));
    address2Input.value = 'Bloc A';
    address2Input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(formState.state().country).toBe('RDC');
    expect(formState.state().city).toBe('Lubumbashi');
    expect(formState.state().postalCode).toBe('00001');
    expect(formState.state().addressLine1).toBe('10 Avenue Kasa-Vubu');
    expect(formState.state().addressLine2).toBe('Bloc A');
  });
});
