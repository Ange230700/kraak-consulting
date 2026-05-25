import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import LocationInformationPage from './location-information.page';
import { UserFormStateService } from '../user-form-state.service';

describe('LocationInformationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationInformationPage, RouterTestingModule],
      providers: [UserFormStateService],
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
});
