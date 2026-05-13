import { Component, input } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'kraak-page-shell',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
  ],
  templateUrl: './page-shell.component.html',
})
export class PageShell {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly backHref = input<string | null>(null);
}
