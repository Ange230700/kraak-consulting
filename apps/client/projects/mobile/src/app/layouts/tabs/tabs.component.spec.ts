import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { describe, it, beforeEach, expect } from 'vitest';
import { MOBILE_PRIMARY_TABS } from '../../core/navigation/mobile-shell.config';
import { TabsLayout } from './tabs.component';

describe('TabsLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsLayout],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ActivatedRoute, useValue: {} }],
    })
      .overrideComponent(TabsLayout, {
        remove: {
          imports: [
            IonTabs,
            IonRouterOutlet,
            IonTabBar,
            IonTabButton,
            IonIcon,
            IonLabel,
          ],
        },
        add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
      })
      .compileComponents();
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
