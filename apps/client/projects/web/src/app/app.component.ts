import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet,
  type ActivatedRouteSnapshot,
} from '@angular/router';
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

  protected readonly usesParticipantShell = signal(false);

  protected focusMainContent(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main-content')?.focus();
  }

  ngOnInit(): void {
    this.refreshAppShell();

    // Only set up browser navigation effects outside SSR.
    if (globalThis.window === undefined || document === undefined) {
      return;
    }

    // Refresh route-aware shell state and reset scroll on navigation.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshAppShell();

        globalThis.window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      });
  }

  private refreshAppShell(): void {
    let currentRoute: ActivatedRouteSnapshot | null =
      this.router.routerState.snapshot.root;
    let appShell: unknown;

    while (currentRoute) {
      const routeShell = currentRoute.data['appShell'];
      if (routeShell !== undefined) {
        appShell = routeShell;
      }

      currentRoute = currentRoute.firstChild;
    }

    this.usesParticipantShell.set(appShell === 'participant');
  }
}
