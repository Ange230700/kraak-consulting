import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { describe, it, beforeEach, expect } from 'vitest';
import { MOBILE_PRIMARY_TABS } from '../../core/navigation/mobile-shell.config';
import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { TabsLayout } from './tabs.component';

describe('TabsLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsLayout],
      providers: [provideRouter([]), provideIonicAngular(), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  describe('TabsLayout avec les composants Ionic réels', () => {
    it('Given le routeur mobile complet, When le shell Ionic est rendu, Then les quatre onglets conservent leurs destinations accessibles', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TabsLayout],
        providers: [
          provideRouter([]),
          provideIonicAngular(),
          provideKraakI18n(),
        ],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
      const fixture = TestBed.createComponent(TabsLayout);
      fixture.detectChanges();
      const tabs = fixture.nativeElement.querySelectorAll(
        'ion-tab-button',
      ) as NodeListOf<HTMLElement & { href: string }>;
      expect(tabs).toHaveLength(4);
      expect(Array.from(tabs).map((tab) => tab.href)).toEqual(
        MOBILE_PRIMARY_TABS.map((tab) => tab.href),
      );
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the tabs stack outlet', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();

    const outlet = fixture.nativeElement.querySelector('ion-router-outlet');
    expect(outlet).toBeTruthy();
  });

  it('Given the frozen MVP shell, when the tabs layout renders, then only four primary tabs are exposed', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('ion-tab-button');
    expect(buttons).toHaveLength(MOBILE_PRIMARY_TABS.length);
  });

  it('should display correct tab labels', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('ion-label'),
    ) as HTMLElement[];
    const texts = labels.map((l) =>
      l.innerHTML.replaceAll(/<!--.*?-->/g, '').trim(),
    );
    expect(texts).toEqual(['Accueil', 'Programmes', 'Annonces', 'Support']);
  });

  it('Given the English locale, when the tabs layout renders, then primary labels are translated', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('ion-label'),
    ) as HTMLElement[];
    const texts = labels.map((label) =>
      label.innerHTML.replaceAll(/<!--.*?-->/g, '').trim(),
    );

    expect(texts).toEqual(['Home', 'Programs', 'Announcements', 'Support']);
  });

  it('should bind each tab button to an explicit mobile route', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();
    const hrefs = fixture.componentInstance['tabs'].map((tab) => tab.href);

    expect(hrefs).toEqual(MOBILE_PRIMARY_TABS.map((tab) => tab.href));
  });

  it('Given no tabs are configured, when the tabs layout renders, then no tab buttons are displayed', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fixture.componentInstance as any).tabs = [];
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('ion-tab-button');
    expect(buttons).toHaveLength(0);
  });

  it('Given each tab, when the component data is inspected, then icon names match the shell config', () => {
    const fixture = TestBed.createComponent(TabsLayout);
    fixture.detectChanges();

    const icons = fixture.componentInstance['tabs'].map((tab) => tab.icon);
    const expected = MOBILE_PRIMARY_TABS.map((t) => t.icon);
    expect(icons).toEqual(expected);
  });

  it('Given a direct class instantiation, when TabsLayout is constructed, then it exposes primary tabs from shell config', () => {
    const instance = new TabsLayout() as unknown as {
      tabs: readonly { href: string }[];
    };

    expect(instance.tabs).toEqual(MOBILE_PRIMARY_TABS);
    expect(instance.tabs).toHaveLength(4);
  });
});
