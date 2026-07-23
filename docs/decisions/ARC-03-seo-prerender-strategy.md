---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-03 — Stratégie de rendu web (SEO / prerender)

| Champ      | Valeur                                                      |
| ---------- | ----------------------------------------------------------- |
| Statut     | **Acceptée**                                                |
| Date       | 2025-07-18                                                  |
| Auteurs    | Équipe KRAAK                                                |
| Dépendance | `ARC-01` (architecture cible validée)                       |
| Liée à     | `WEB-03` (meta, sitemap, robots, Open Graph — milestone M5) |

---

## Contexte

Le site vitrine KRAAK est construit avec **Angular 21**. Par défaut, une
application Angular s'exécute côté client (SPA) : le HTML initial est vide et le
contenu est rendu par JavaScript dans le navigateur.

Ce comportement pose trois problèmes pour un site vitrine à vocation
marketing :

1. **SEO** — Les moteurs de recherche peuvent indexer du contenu rendu
   côté client, mais le crawl est plus lent, moins fiable, et consomme
   davantage de budget d'exploration (_crawl budget_). Un HTML complet
   côté serveur garantit que chaque page est indexée correctement dès la
   première visite du robot.
2. **Performance perçue** — Le temps avant le premier affichage significatif
   (_First Contentful Paint_, _Largest Contentful Paint_) est plus long
   quand le navigateur doit télécharger, parser et exécuter le bundle JS
   avant de produire le HTML. Un document HTML pré-rendu est affiché
   instantanément depuis le cache CDN.
3. **Partage social / Open Graph** — Les bots de réseaux sociaux (Facebook,
   LinkedIn, Twitter/X) ne rendent pas le JavaScript. Sans HTML pré-rendu,
   les aperçus de liens sont vides ou incorrects.

Angular fournit nativement deux stratégies de rendu côté serveur depuis la
version 17+ :

- **SSR dynamique** (`RenderMode.Server`) — chaque requête est rendue à la
  volée par un serveur Node.js / Express.
- **Prerender** (`RenderMode.Prerender`) — les pages sont rendues au moment
  du build et servies comme des fichiers HTML statiques.

Le site KRAAK au stade MVP est composé exclusivement de pages publiques à
contenu statique ou quasi-statique (accueil, à propos, services, programmes,
contact). Aucune page ne nécessite de données dynamiques côté serveur au
moment du rendu.

---

## Décision

**Adopter le prerender intégral (`RenderMode.Prerender`) comme stratégie de
rendu par défaut pour toutes les routes du site vitrine.**

L'hydratation côté client est activée avec `withEventReplay()` pour garantir
l'interactivité (animations, formulaires, navigation SPA) après le
chargement initial.

---

## Justification

| Critère                   | Prerender (retenu)                      | SSR dynamique (écarté)                    |
| ------------------------- | --------------------------------------- | ----------------------------------------- |
| Temps de réponse (TTFB)   | ~0 ms (fichier statique CDN)            | 50-200 ms (rendu Node.js par requête)     |
| Coût d'hébergement        | Nul (fichiers statiques sur Render CDN) | Runtime Node.js en permanence             |
| Scalabilité               | Infinie (CDN edge)                      | Limitée par le nombre d'instances Node    |
| Complexité opérationnelle | Aucune infra serveur côté rendu         | Gestion serveur, cold starts, monitoring  |
| Fraîcheur du contenu      | Rebuilt à chaque déploiement            | Temps réel                                |
| Compatibilité MVP         | Parfaite (contenu statique)             | Sur-dimensionnée pour du contenu statique |

Le contenu du site vitrine MVP ne change qu'à chaque déploiement. Le
prerender élimine tout serveur de rendu et maximise les performances à coût
nul. Si un besoin de contenu dynamique côté serveur apparaît plus tard
(portail participant V1.1+), la migration vers `RenderMode.Server` sur les
routes concernées sera incrémentale grâce à la configuration par route dans
`app.routes.server.ts`.

---

## Implémentation en place

### Configuration des routes serveur

**`apps/client/projects/web/src/app/app.routes.server.ts`** :

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
```

Toutes les routes sont pré-rendues au build. Pour ajouter une route SSR
dynamique à l'avenir, il suffit d'ajouter une entrée spécifique avant le
catch-all `**`.

### Configuration serveur Angular

**`apps/client/projects/web/src/app/app.config.server.ts`** :

```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

### Hydratation client

**`apps/client/projects/web/src/app/app.config.ts`** :

```typescript
provideClientHydration(withEventReplay());
```

L'hydratation permet à Angular de reprendre le contrôle du DOM pré-rendu
sans le recréer. `withEventReplay()` capture les événements utilisateur
survenant avant la fin de l'hydratation et les rejoue ensuite, évitant toute
perte d'interaction.

### Serveur Express SSR

**`apps/client/projects/web/src/server.ts`** :

Le serveur Express utilise `AngularNodeAppEngine` pour :

1. Servir les fichiers statiques pré-rendus depuis `dist/web/browser` avec
   cache longue durée (`maxAge: '1y'`).
2. Déléguer toute requête non statique au moteur Angular SSR (utilisé au
   build pour le prerender, et potentiellement au runtime si des routes SSR
   dynamiques sont ajoutées).

### Build et déploiement

- **`angular.json`** : `outputMode: "server"` avec entrée SSR pointant vers
  `server.ts`. Le build produit `dist/web/browser/` (HTML pré-rendu) et
  `dist/web/server/` (serveur Express).
- **Artefacts SEO statiques** : `robots.txt` et `sitemap.xml` sont générés
  avant le build web à partir de la configuration SEO partagée des routes
  marketing, puis copiés dans `projects/web/public/` pour rester compatibles
  avec le déploiement Render purement statique.
- **`render.yaml`** : `outputDirectory: "apps/client/dist/web/browser"` —
  Render sert directement les fichiers HTML statiques pré-rendus depuis son
  CDN edge mondial.
- **CI** : Le pipeline GitHub Actions exécute `pnpm --filter @kraak/client
run build` qui déclenche le prerender de toutes les routes.

---

## Alternatives considérées

### 1. SPA pure (pas de rendu serveur)

Écarté. Incompatible avec les objectifs SEO d'un site vitrine marketing. Les
moteurs de recherche indexent le contenu côté client de manière moins fiable,
et les bots sociaux ne rendent pas le JavaScript.

### 2. SSR dynamique (`RenderMode.Server`) sur toutes les routes

Écarté. Ajoute un coût serveur et une complexité opérationnelle sans
bénéfice pour du contenu statique. Le TTFB serait systématiquement plus
élevé qu'avec des fichiers pré-rendus servis depuis un CDN.

### 3. Solution de prerender externe (Prerender.io, Rendertron)

Écarté. Angular fournit nativement le prerender intégré. Ajouter un service
tiers augmente la complexité, le coût, et introduit une dépendance externe
inutile.

### 4. Framework SSR alternatif (Next.js, Nuxt, Astro)

Hors périmètre. L'architecture Angular est validée (`ARC-01`). Changer de
framework n'est pas envisagé.

---

## Limites et évolutions prévues

- **Contenu dynamique V1.1+** — Si des pages avec données temps réel sont
  ajoutées (portail participant, espace personnel), elles utiliseront
  `RenderMode.Server` sur leurs routes spécifiques. La configuration par
  route dans `app.routes.server.ts` le permet sans modifier les routes
  statiques existantes.
- **SEO technique (WEB-03)** — L'ajout des balises meta, du sitemap.xml, du
  robots.txt et des balises Open Graph est planifié dans le milestone M5.
  Ces éléments complètent la stratégie de prerender mais sont indépendants
  de la décision de rendu elle-même.
- **ISR (Incremental Static Regeneration)** — Angular ne supporte pas
  nativement l'ISR au moment de cette décision. Si un besoin de
  régénération incrémentale apparaît, la migration vers SSR dynamique sur
  les routes concernées sera la voie retenue.

---

## Références

- [Angular SSR Guide](https://angular.dev/guide/ssr)
- [Angular Prerendering Guide](https://angular.dev/guide/prerendering)
- [Render Static Site Deployment](https://render.com/docs/frameworks)
- `ARCHITECTURE.md` — section _SEO Et Web Marketing_
- `docs/planning/GITHUB_PROJECT.md` — `ARC-03`, `WEB-03`
