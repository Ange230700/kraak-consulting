import { TestBed } from '@angular/core/testing';

import { Badge } from './badge.component';

describe('Badge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Badge],
    }).compileComponents();
  });

  it('should render a PrimeNG tag with the given label', () => {
    const fixture = TestBed.createComponent(Badge);
    fixture.componentRef.setInput('label', 'Formation');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.p-tag')).toBeTruthy();
  });
});
