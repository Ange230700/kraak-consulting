# Kit d'implementation motion - Web vitrine KRAAK

Ce document fournit des artefacts prêts a coder pour:

1. Un bloc de tokens CSS/Tailwind pret a coller.
2. Un blueprint Angular pour les transitions de route et une directive reveal.
3. Une matrice QA motion (desktop/mobile/reduced-motion).

Contexte cible du depot:

- Angular: `apps/client/projects/web`
- Tailwind v4 CSS-first: `apps/client/projects/web/src/tailwind.css`
- Styles globaux: `apps/client/projects/web/src/styles.scss`
- Routing: `apps/client/projects/web/src/app/app.routes.ts`

## 1) Bloc tokens CSS/Tailwind pret a coller

Coller ce bloc dans `apps/client/projects/web/src/tailwind.css`:

```css
/* ===== Motion tokens KRAAK (vitrine) ===== */
@theme {
  /* Durations */
  --motion-duration-xs: 120ms;
  --motion-duration-sm: 180ms;
  --motion-duration-md: 260ms;
  --motion-duration-lg: 360ms;

  /* Easings */
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --motion-ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-emphasis-soft: cubic-bezier(0.22, 1, 0.36, 1);

  /* Distances */
  --motion-shift-xs: 4px;
  --motion-shift-sm: 8px;
  --motion-shift-md: 16px;
  --motion-shift-lg: 24px;

  /* Opacity */
  --motion-opacity-from: 0;
  --motion-opacity-to: 1;
}

@utility motion-safe-transition {
  @media (prefers-reduced-motion: no-preference) {
    transition-property:
      transform, opacity, box-shadow, filter, color, border-color,
      background-color;
    transition-duration: var(--motion-duration-sm);
    transition-timing-function: var(--motion-ease-standard);
  }
}

@utility motion-enter-up {
  @media (prefers-reduced-motion: no-preference) {
    transform: translateY(var(--motion-shift-md));
    opacity: var(--motion-opacity-from);
  }
}

@utility motion-enter-up-active {
  @media (prefers-reduced-motion: no-preference) {
    transform: translateY(0);
    opacity: var(--motion-opacity-to);
    transition-property: transform, opacity;
    transition-duration: var(--motion-duration-md);
    transition-timing-function: var(--motion-ease-enter);
  }
}

@utility motion-hover-lift {
  @media (prefers-reduced-motion: no-preference) {
    transition-property: transform, box-shadow, border-color, background-color;
    transition-duration: var(--motion-duration-xs);
    transition-timing-function: var(--motion-ease-standard);

    &:hover,
    &:focus-visible {
      transform: translateY(calc(-1 * var(--motion-shift-xs)));
    }
  }
}

@utility motion-press {
  @media (prefers-reduced-motion: no-preference) {
    &:active {
      transform: scale(0.98);
    }
  }
}

@utility motion-reveal-base {
  opacity: var(--motion-opacity-from);

  @media (prefers-reduced-motion: no-preference) {
    transform: translateY(var(--motion-shift-md));
    transition-property: transform, opacity;
    transition-duration: var(--motion-duration-md);
    transition-timing-function: var(--motion-ease-enter);
  }
}

@utility motion-reveal-visible {
  opacity: var(--motion-opacity-to);

  @media (prefers-reduced-motion: no-preference) {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .motion-safe-transition,
  .motion-enter-up,
  .motion-enter-up-active,
  .motion-hover-lift,
  .motion-press,
  .motion-reveal-base,
  .motion-reveal-visible {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    transform: none !important;
  }
}
```

Option d'harmonisation dans `apps/client/projects/web/src/styles.scss`:

```scss
/* PrimeNG + tokens motion: boutons et overlays */
.p-button,
.p-card,
.p-dialog,
.p-drawer,
.p-toast {
  transition-property:
    transform, opacity, box-shadow, border-color, background-color;
  transition-duration: var(--motion-duration-sm);
  transition-timing-function: var(--motion-ease-standard);
}

.p-button:not(:disabled):hover,
.p-button:not(:disabled):focus-visible {
  transform: translateY(calc(-1 * var(--motion-shift-xs)));
}

.p-button:not(:disabled):active {
  transform: scale(0.98);
}
```

## 2) Blueprint Angular (route transitions + reveal directive)

### 2.1 Route transitions (Angular 21 + View Transitions)

Dans `apps/client/projects/web/src/app/app.config.ts`, activer les View Transitions Router:

```ts
import { provideRouter, withViewTransitions } from '@angular/router';

// ...
provideRouter(routes, withViewTransitions());
```

Ajouter ensuite les animations de transition de route dans
`apps/client/projects/web/src/tailwind.css`:

```css
::view-transition-old(root) {
  animation: kr-route-fade-out var(--motion-duration-sm) var(--motion-ease-exit)
    both;
}

::view-transition-new(root) {
  animation: kr-route-fade-in var(--motion-duration-md) var(--motion-ease-enter)
    both;
}

@keyframes kr-route-fade-in {
  from {
    opacity: 0;
    transform: translateY(var(--motion-shift-md));
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes kr-route-fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(var(--motion-shift-sm));
  }
}
```

### 2.2 Directive reveal au scroll

Créer `apps/client/projects/web/src/app/shared/motion/reveal-on-scroll.directive.ts`:

```ts
import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[kraakRevealOnScroll]',
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  @Input() revealDelayMs = 0;
  @Input() revealOnce = true;
  @Input() revealThreshold = 0.2;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;

    this.renderer.addClass(element, 'motion-reveal-base');
    this.renderer.setStyle(
      element,
      'transition-delay',
      `${this.revealDelayMs}ms`,
    );

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      this.renderer.addClass(element, 'motion-reveal-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            if (!this.revealOnce) {
              this.renderer.removeClass(element, 'motion-reveal-visible');
            }
            continue;
          }

          this.renderer.addClass(element, 'motion-reveal-visible');

          if (this.revealOnce) {
            this.observer?.unobserve(element);
          }
        }
      },
      {
        threshold: this.revealThreshold,
      },
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    const element = this.elementRef.nativeElement;
    try {
      this.observer?.unobserve(element);
      this.observer?.disconnect();
    } catch (error) {
      console.warn('[RevealOnScrollDirective] Observer cleanup failed.', {
        context: 'ngOnDestroy',
        error,
      });
    }
  }
}
```

### 2.3 Enregistrement de la directive

Si vous avez deja un barrel/shared module standalone, y ajouter la directive.
Sinon, exemple d'import dans une page standalone (`*.page.ts`):

```ts
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';

@Component({
  // ...
  imports: [
    // ...
    RevealOnScrollDirective,
  ],
})
export class HomePage {}
```

Usage template:

```html
<section kraakRevealOnScroll [revealDelayMs]="0">...</section>

<article kraakRevealOnScroll [revealDelayMs]="60">...</article>
```

### 2.4 Blueprint d'integration shell

Le shell principal ne change pas: garder un `router-outlet` standard dans
`app.component.html`, les transitions sont appliquees globalement via
`withViewTransitions()` + pseudo-elements CSS `::view-transition-*`.

### 2.5 Notes d'implementation

- Cette approche evite les APIs d'animations Angular depreciees en v21.
- Les timings restent centralises via les motion tokens dans `tailwind.css`.
- `prefers-reduced-motion` continue de desactiver les mouvements non essentiels.

## 3) Matrice QA motion (desktop/mobile/reduced-motion)

Format de recette recommande: `Given/When/Then`.

| ID      | Contexte       | Given                                               | When                         | Then                                        | Critère de validation                         |
| ------- | -------------- | --------------------------------------------------- | ---------------------------- | ------------------------------------------- | --------------------------------------------- |
| MOT-001 | Desktop        | L'utilisateur est sur `/` (1366x768)                | La page charge               | Le hero entre en fade+rise en < 300ms       | Pas de saut visuel, CTA lisible immédiatement |
| MOT-002 | Desktop        | L'utilisateur survole un bouton primaire            | Hover/focus visible          | Le bouton monte légèrement                  | Translation max 4px, aucun flou texte         |
| MOT-003 | Desktop        | L'utilisateur clique un bouton                      | État actif                   | Le bouton passe en press                    | Scale approx 0.98, retour en < 120ms          |
| MOT-004 | Desktop        | L'utilisateur navigue `/` vers `/services`          | Changement de route          | Sortie 180ms + entree 260ms                 | Aucune page blanche longue, aucune saccade    |
| MOT-005 | Desktop        | Section cards hors viewport                         | Scroll jusqu'a la section    | Reveal progressif (stagger)                 | Max 4 elements staggers, délai 40-70ms        |
| MOT-006 | Mobile         | L'utilisateur est sur `/programmes` (390x844)       | Scroll rapide                | Les reveals restent fluides                 | Pas de chute notable de FPS, lecture intacte  |
| MOT-007 | Mobile         | L'utilisateur ouvre une overlay PrimeNG             | Ouverture/fermeture          | Transition nette et brève                   | <= 300ms, focus clavier conserve              |
| MOT-008 | Mobile         | L'utilisateur soumet `/contact`                     | État loading puis succès     | Message de confirmation apparaît en douceur | Pas d'attente sans feedback, état clair       |
| MOT-009 | Reduced motion | `prefers-reduced-motion: reduce` actif              | Navigation + hover + scroll  | Animations non essentielles supprimées      | Pas de translate/scale/parallax               |
| MOT-010 | Reduced motion | `prefers-reduced-motion: reduce` actif              | Focus clavier sur CTA/champs | Focus reste tres visible                    | Accessibilité maintenue sans mouvement        |
| MOT-011 | Cross-pages    | Navigation `/a-propos` -> `/services` -> `/contact` | Sequence complete            | Cohesion motion globale                     | Meme signature timing/easing sur toutes pages |
| MOT-012 | Perf           | Lighthouse/DevTools sur mobile                      | Profiling                    | Animations n'affectent pas LCP/CLS          | LCP non degrade, CLS stable                   |

Checklist de cloture recette:

- [ ] Toutes les transitions route sont <= 360ms.
- [ ] Les micro-interactions sont <= 180ms.
- [ ] `prefers-reduced-motion` désactive les mouvements décoratifs.
- [ ] Aucun blocage clavier/focus pendant animation.
- [ ] Aucun usage d'animation layout-heavy (`top/left/width/height`).

## Sequence d'implementation recommandée (3 PRs)

1. PR-1: tokens motion + utilitaires Tailwind + harmonisation PrimeNG.
2. PR-2: route transitions Angular (withViewTransitions + CSS view transitions).
3. PR-3: directive reveal + application progressive sur pages vitrine.
