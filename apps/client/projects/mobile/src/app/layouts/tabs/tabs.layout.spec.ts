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
import { TabsLayout } from './tabs.layout';

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
    expect(buttons.length).toBe(4);
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
    const hrefs = fixture.componentInstance['tabs'].map((tab) => tab.href);

    expect(hrefs).toEqual([
      '/tabs/accueil',
      '/tabs/programmes',
      '/tabs/annonces',
      '/tabs/support',
    ]);
  });
});
