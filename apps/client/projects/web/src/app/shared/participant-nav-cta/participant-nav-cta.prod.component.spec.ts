// apps\client\projects\web\src\app\shared\participant-nav-cta\participant-nav-cta.prod.component.spec.ts

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

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

  it('Given the production CTA wrapper When it is activated programmatically Then it emits the activated output', () => {
    const fixture = TestBed.createComponent(ParticipantNavCta);
    const emitSpy = vi.spyOn(fixture.componentInstance.activated, 'emit');

    fixture.componentInstance['notifyActivated']();

    expect(emitSpy).toHaveBeenCalled();
  });
});
