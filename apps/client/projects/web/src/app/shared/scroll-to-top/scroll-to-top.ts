import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kraak-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-to-top.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollToTop implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  isVisible = false;
  private readonly scrollThreshold = 300;
  private scrollListener: (() => void) | null = null;

  ngOnInit(): void {
    // Only set up scroll listener in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.scrollListener = () => this.updateVisibility();
    window.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy(): void {
    if (this.scrollListener && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  updateVisibility(): void {
    this.isVisible = window.scrollY > this.scrollThreshold;
    this.cdr.markForCheck();
  }

  scrollToTop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
