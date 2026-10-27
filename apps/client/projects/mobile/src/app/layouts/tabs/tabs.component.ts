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
import { KraakTranslatePipe } from '../../../../../shared/i18n';

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
    KraakTranslatePipe,
  ],
  templateUrl: './tabs.component.html',
})
export class TabsLayout {
  protected readonly tabs = MOBILE_PRIMARY_TABS;
}
