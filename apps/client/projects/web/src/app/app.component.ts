import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { filter } from 'rxjs';

import { KraakTranslatePipe } from '../../../shared/i18n';
import { Footer } from './layouts/footer/footer.component';
import { Navbar } from './layouts/navbar/navbar.component';
import { ScrollToTop } from './shared/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'kraak-root',
  imports: [
    RouterOutlet,
    Navbar,
    Footer,
    Toast,
    ScrollToTop,
    KraakTranslatePipe,
  ],
  templateUrl: './app.component.html',
})
export class App implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  protected focusMainContent(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main-content')?.focus();
  }

  ngOnInit(): void {
    // Only set up scroll-to-top in browser environment (not during SSR)
    if (globalThis.window === undefined || document === undefined) {
      return;
    }

    // Scroll to top smoothly when navigating to a new page
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Smoothly reset scroll position on each route change.
        globalThis.window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      });
  }
}
