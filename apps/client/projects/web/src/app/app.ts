import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { filter } from 'rxjs';
import gsap from 'gsap';

import { Footer } from './layouts/footer/footer';
import { Navbar } from './layouts/navbar/navbar';

@Component({
  selector: 'kraak-root',
  imports: [RouterOutlet, Navbar, Footer, Toast],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Only set up scroll-to-top in browser environment (not during SSR)
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Scroll to top smoothly when navigating to a new page
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Smooth scroll to top using GSAP
        gsap.to(window, {
          scrollTo: { y: 0 },
          duration: 0.5,
          ease: 'power2.inOut',
        });
      });
  }
}
