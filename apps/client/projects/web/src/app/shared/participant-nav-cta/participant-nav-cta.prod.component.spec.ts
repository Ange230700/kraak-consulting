import { TestBed } from '@angular/core/testing';

import { ParticipantNavCta } from './participant-nav-cta.prod.component';

describe('ParticipantNavCta prod variant', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantNavCta],
    }).compileComponents();
  });

  it('Given the production CTA wrapper When it renders Then it stays empty', () => {
    const fixture = TestBed.createComponent(ParticipantNavCta);
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent as string).trim()).toBe('');
  });
});
