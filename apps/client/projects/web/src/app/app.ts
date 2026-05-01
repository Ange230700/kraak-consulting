import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

import { Footer } from './layouts/footer/footer';
import { Navbar } from './layouts/navbar/navbar';

@Component({
  selector: 'kraak-root',
  imports: [RouterOutlet, Navbar, Footer, Toast],
  templateUrl: './app.html',
})
export class App {}
