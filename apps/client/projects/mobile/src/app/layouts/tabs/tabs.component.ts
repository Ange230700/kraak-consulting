import { Component } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  bookOutline,
  megaphoneOutline,
  helpCircleOutline,
} from 'ionicons/icons';
import { MOBILE_PRIMARY_TABS } from '../../core/navigation/mobile-shell.config';

interface MobileTabLink {
  readonly label: string;
  readonly tab: string;
  readonly href: string;
  readonly icon: string;
}

addIcons({
  homeOutline,
  bookOutline,
  megaphoneOutline,
  helpCircleOutline,
});

@Component({
  selector: 'kraak-tabs-layout',
  standalone: true,
  imports: [
    IonTabs,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
  templateUrl: './tabs.component.html',
})
export class TabsLayout {
  protected readonly tabs: MobileTabLink[] = MOBILE_PRIMARY_TABS;
}
