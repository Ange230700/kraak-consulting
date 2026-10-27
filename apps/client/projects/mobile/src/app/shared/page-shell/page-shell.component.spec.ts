import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageShellComponent } from './page-shell.component';

@Component({
  standalone: true,
  imports: [PageShellComponent],
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

@Component({
  standalone: true,
  imports: [PageShellComponent],
  template: `
    <kraak-page-shell title="Vue simple">
      <p>Contenu minimal</p>
    </kraak-page-shell>
  `,
})
class TestMinimalHostComponent {}

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

  it('Given optional header fields are omitted, when the shell renders, then back button, eyebrow and description are hidden', () => {
    const fixture = TestBed.createComponent(TestMinimalHostComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Vue simple');
    expect(element.querySelector('ion-back-button')).toBeFalsy();
    expect(element.textContent).not.toContain('KRAAK mobile');
    expect(element.textContent).not.toContain(
      'Retrouvez les parcours actifs et les ressources utiles.',
    );
  });
});
