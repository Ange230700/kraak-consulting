import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Card } from './card';

describe('Card', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render a PrimeNG card surface with a PrimeNG action link', () => {
    const fixture = TestBed.createComponent(Card);
    fixture.componentRef.setInput('title', 'Formation');
    fixture.componentRef.setInput(
      'description',
      'Un accompagnement structur\u00E9.',
    );
    fixture.componentRef.setInput('link', '/services');
    fixture.componentRef.setInput('linkLabel', 'D\u00E9couvrir');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.p-card')).toBeTruthy();
    expect(element.querySelector('.p-button')).toBeTruthy();
  });

  // Given icon is provided
  // When the card is rendered
  // Then the icon element is displayed
  it('Given an icon input, when the card is rendered, then the icon element is displayed', () => {
    const fixture = TestBed.createComponent(Card);
    fixture.componentRef.setInput('icon', 'pi pi-star');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('i.pi.pi-star')).toBeTruthy();
  });

  // Given no title, no description, and no link
  // When the card is rendered
  // Then no h3, no description paragraph, and no action link are rendered
  it('Given no title, description or link, when the card is rendered, then those elements are absent', () => {
    const fixture = TestBed.createComponent(Card);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h3')).toBeNull();
    expect(element.querySelector('a.p-button')).toBeNull();
  });
});
