import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageShell } from './page-shell.component';

@Component({
  standalone: true,
  imports: [PageShell],
  template: `
    <kraak-page-shell
      eyebrow="KRAAK mobile"
      title="Programmes"
      description="Retrouvez les parcours actifs et les ressources utiles."
      backHref="/tabs/accueil"
    >
      <p>Contenu de test</p>
    </kraak-page-shell>
  `,
})
class TestHostComponent {}

describe('PageShell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should render the shared mobile page header', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('KRAAK mobile');
    expect(element.textContent).toContain('Programmes');
    expect(element.textContent).toContain(
      'Retrouvez les parcours actifs et les ressources utiles.',
    );
    expect(element.querySelector('ion-back-button')).toBeTruthy();
  });

  it('should project the page content inside the layout body', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('ion-content');
    expect(content?.textContent).toContain('Contenu de test');
  });
});
