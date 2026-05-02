import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import WelcomePage from './welcome.page';

describe('Mobile WelcomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given la page welcome When elle est rendue Then elle affiche les CTA principaux', () => {
    const fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Bienvenue dans votre espace participant');
    expect(text).toContain('D\u00E9marrer');
    expect(text).toContain('Se connecter');
  });
});
