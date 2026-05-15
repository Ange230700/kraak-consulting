import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'kraak-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.component.html',
})
export class App {}
