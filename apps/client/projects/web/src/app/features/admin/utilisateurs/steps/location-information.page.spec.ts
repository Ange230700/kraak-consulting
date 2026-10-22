import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import LocationInformationPage from './location-information.page';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../../shared/i18n';
import { UserFormStateService } from '../user-form-state.service';

function dispatchDomEvent(target: Element, type: string): void {
  const event = target.ownerDocument.createEvent('Event');
  event.initEvent(type, true, true);
  target.dispatchEvent(event);
}

describe('LocationInformationPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [LocationInformationPage],
      providers: [provideKraakI18n(), provideRouter([]), UserFormStateService],
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
    dispatchDomEvent(countryInput, 'input');
    cityInput.value = 'Lubumbashi';
    dispatchDomEvent(cityInput, 'input');
    postalCodeInput.value = '00001';
    dispatchDomEvent(postalCodeInput, 'input');
    address1Input.value = '10 Avenue Kasa-Vubu';
    dispatchDomEvent(address1Input, 'input');
    address2Input.value = 'Bloc A';
    dispatchDomEvent(address2Input, 'input');
    fixture.detectChanges();

    expect(formState.state().country).toBe('RDC');
    expect(formState.state().city).toBe('Lubumbashi');
    expect(formState.state().postalCode).toBe('00001');
    expect(formState.state().addressLine1).toBe('10 Avenue Kasa-Vubu');
    expect(formState.state().addressLine2).toBe('Bloc A');
  });

  it('Given English locale, When the step renders, Then it renders Location chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(LocationInformationPage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent ?? '';

    expect(text).toContain('Step 3 of 5');
    expect(text).toContain('Location');
    expect(text).toContain('Country');
    expect(text).toContain('City');
    expect(text).toContain('Postal code');
    expect(text).toContain('Address line 1');
    expect(text).toContain('Address line 2');
    expect(text).toContain('Previous');
    expect(text).toContain('Next');

    expect(
      (host.querySelector('#country') as HTMLInputElement).placeholder,
    ).toBe('E.g. Democratic Republic of the Congo');

    expect(
      (host.querySelector('#addressLine2') as HTMLInputElement).placeholder,
    ).toBe('Apartment, building…');
  });
});
