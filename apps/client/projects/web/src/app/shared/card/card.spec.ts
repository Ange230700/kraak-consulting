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
});
