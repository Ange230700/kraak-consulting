<!-- ARCHITECTURE.md -->

# ARCHITECTURE.md

## Objectif

Ce document fixe la décision d'architecture active pour KRAAK et sert de
référence après l’amorçage initial du dépôt.

Il sert de référence technique prioritaire quand un choix concret entre en
conflit avec la pile par défaut mentionnée dans `AGENTS.md`.

---

## Statut De La Décision

- Statut : validé
- Moment de déclaration : après cadrage MVP, puis mis à jour au fil de la mise
  en place réelle du monorepo
- Portée : site web MVP, application mobile MVP, API/backend, données,
  notifications, analytics, déploiement

### État Actuel Du Repo

- `apps/client` contient le workspace Angular avec les projets `web` et
  `mobile`
- `apps/api` contient le bootstrap NestJS et les premiers répertoires de modules
- les quatre packages partagés (`packages/tokens`, `packages/contracts`,
  `packages/domain` et `packages/api-client`) sont implémentés avec couverture
  de tests unitaires (voir `docs/runbooks/PACKAGE_GUIDELINES.md`)
- `render.yaml` est déjà présent pour cadrer le déploiement

---

## Décision Globale

La pile retenue pour KRAAK n'est **pas** la pile par défaut `Next.js` indiquée
comme base générique dans `AGENTS.md`.

La décision validée pour ce projet est :

- fondation frontend unique : **Angular workspace**
- couche UI web marketing : **PrimeNG**
- couche UI mobile : **Ionic Angular**
- runtime mobile : **Capacitor**
- backend / API : **NestJS**
- données / auth / stockage : **Supabase**
- notifications mobile : **Firebase Cloud Messaging** via Capacitor ou solution
  équivalente compatible
- analytics web : **PostHog** et/ou **Google Analytics** selon besoin réel
- analytics mobile : outil dédié uniquement si le besoin de pilotage mobile le
  justifie
- déploiement web : **Render** ou équivalent
- distribution mobile : **APK**, **TestFlight** et/ou canaux de test interne
- stratégie de contenu : contenu web statique ou géré simplement ; contenu
  mobile servi par l'API/backend

---

## Principes Structurants

### 1. Frontend Workspace Unique

Le frontend doit partir d'un **workspace Angular unique** comme fondation
technique commune.

Objectifs :

- mutualiser l'outillage front
- garder une convention commune pour le code client
- réutiliser plus facilement types, services, contrats et composants si utile
- éviter l'introduction d'une seconde pile frontend non nécessaire au MVP

Cette décision autorise plusieurs applications dans le même socle, en priorité :

- `apps/client/projects/web` pour le site marketing
- `apps/client/projects/mobile` pour l'application mobile Ionic Angular

### 2. Web Et Mobile Séparés Dans Leur UI, Unifiés Dans Le Socle

Le site web et le mobile n'ont pas la même couche UI, mais partagent la même
base Angular de travail.

- web : UI orientée marketing, conversion, crédibilité
- mobile : UI orientée usage récurrent, navigation d'app, sessions utilisateur,
  notifications, consultation de contenu

### 3. Backend Unique Et Explicite

Le backend applicatif retenu est **NestJS**.

Le projet ne doit pas s'appuyer sur des route handlers web comme couche backend
principale. Toute logique métier non triviale, toute orchestration, toute API
mobile, tout flux de notification ou de données doit être pensé côté NestJS.

### 4. BaaS Ciblé, Pas D'ORM Par Défaut

Le socle data/auth/storage retenu est **Supabase**.

Cela couvre prioritairement :

- base de données PostgreSQL
- authentification
- stockage de fichiers
- services backend utiles au MVP

Un ORM n'est pas introduit par défaut à ce stade. Si ce besoin apparaît plus
tard, il devra être justifié dans une décision complémentaire.

---

## Stack Confirmée

### Frontend Workspace

- **Angular workspace** comme fondation frontend unique

### Site Web

- framework : **Angular**
- couche UI : **PrimeNG**
- bibliothèque d'icônes : **PrimeIcons** (`primeicons`) — les emojis **ne doivent pas** être utilisés comme icônes UI ; utiliser exclusivement les classes `pi pi-*` (voir <https://primeng.org/icons>)
- usage : site vitrine/marketing KRAAK
- priorité : SEO, clarté éditoriale, conversion, accessibilité de base,
  performance de base

### Mobile

- framework : **Ionic Angular**
- runtime : **Capacitor**
- usage : expérience mobile applicative, comptes participants, consultation de
  contenu, notifications, interactions récurrentes

### Backend / API

- framework : **NestJS**
- rôle : API métier, orchestration, intégration Supabase, exposition des données
  consommées par le mobile et les formulaires/processus utiles au web
- documentation : **Swagger / OpenAPI** accessible à `/api-docs`

### Données / Auth / Stockage

- **Supabase**
- database : PostgreSQL managé
- auth : Supabase Auth
- storage : Supabase Storage

### Notifications

- **Firebase Cloud Messaging** via **Capacitor**
- alternative admise : solution équivalente si elle reste compatible avec la
  pile mobile retenue et garde une complexité MVP raisonnable

### Analytics

- web : **PostHog** et/ou **Google Analytics**
- mobile : outil dédié seulement si les besoins produit le demandent vraiment

### Déploiement

- website : **Render** ou équivalent compatible front Angular
- mobile : distribution via **APK**, **TestFlight**, canaux de test interne, ou
  processus équivalent selon la phase

### Stratégie De Contenu

- website : contenu statique ou géré simplement
- mobile : contenu récupéré depuis l'API/backend

---

## Conséquences D'Architecture

### Organisation Cible Du Dépôt

Structure cible recommandée :

```txt
/
├─ apps/
│  ├─ api/                    # NestJS
│  └─ client/
│     ├─ angular.json         # configuration du workspace Angular
│     ├─ projects/
│     │  ├─ web/              # site Angular + PrimeNG
│     │  └─ mobile/           # Ionic Angular + Capacitor
│     └─ tests/
│        └─ e2e/              # Playwright web
├─ packages/
│  ├─ tokens/
│  ├─ contracts/
│  ├─ api-client/
│  └─ domain/
├─ supabase/
│  └─ migrations/           # migrations SQL Supabase
└─ docs/
```

### Contrats Et Flux De Données

- le web peut rester majoritairement statique au MVP
- le mobile dépend d'une API/backend explicite
- les contenus et états utilisateurs mobiles ne doivent pas être embarqués en
  dur comme stratégie par défaut
- les contrats consommés par le mobile doivent être stables, typés et versionnables
- les packages `contracts`, `domain` et `api-client` sont implémentés et testés ;
  les étendre au fil des flux métier partagés

### SEO Et Web Marketing

Le site web doit être configuré pour servir correctement :

- metadata
- Open Graph
- sitemap
- robots
- instrumentation analytics

Le choix Angular pour le site implique de traiter explicitement la stratégie de
rendu et de pré-rendu au moment du setup applicatif.

> **Décision documentée** : la stratégie retenue est le **prerender intégral**
> (`RenderMode.Prerender`) sur toutes les routes du site vitrine. Voir
> [`docs/decisions/ARC-03-seo-prerender-strategy.md`](docs/decisions/ARC-03-seo-prerender-strategy.md)
> pour le détail complet (justification, alternatives écartées, limites,
> évolutions prévues).

### Mobile Et Notifications

Le mobile n'est pas traité comme simple duplication responsive du site.

L'application mobile doit être pensée pour :

- authentification utilisateur
- contenu contextualisé
- sessions / programmes / ressources
- notifications push
- distribution hors navigateur

---

## Décisions De Mise En Oeuvre À Respecter

- Ne pas introduire `Next.js` comme fondation du projet.
- Ne pas construire la couche mobile sur PrimeNG seul ; utiliser **Ionic Angular**.
- Ne pas remplacer **NestJS** par une logique backend dispersée dans le frontend.
- Ne pas faire du contenu mobile une simple copie statique du site si une API est
  requise.
- Ne pas ajouter un ORM sans décision technique explicite complémentaire.
- Ne pas alourdir l'analytics mobile sans besoin produit concret.

---

## Prochaines Étapes Techniques

1. Brancher les routes Angular web/mobile aux répertoires `features/` déjà créés.
2. Remplacer le bootstrap API minimal par de vrais modules métier dans
   `apps/api/src/`.
3. ~~Donner un manifeste et une implémentation réelle aux packages partagés~~ —
   fait (LIB-01 à LIB-04). Étendre les contrats et la logique métier au fil des
   besoins.
4. Brancher l'API NestJS au client Supabase et configurer Resend (le schéma
   initial de la base de données est défini dans
   `supabase/migrations/20250718000000_initial_schema.sql`).
5. Stabiliser la stratégie de rendu web pour le SEO sur le projet `web`.
6. Préparer la stratégie de notifications mobile quand le flux participant le
   justifiera.

---

## Règle De Priorité

En cas de contradiction entre un document de contexte, une hypothèse ancienne,
ou la pile générique d'un autre document, **ce fichier fait foi pour la décision
d'architecture active** jusqu'à nouvelle mise à jour explicite.
