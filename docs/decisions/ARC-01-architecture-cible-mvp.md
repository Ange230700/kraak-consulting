---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-01 — Architecture cible MVP

| Champ          | Valeur                 |
| -------------- | ---------------------- |
| **Statut**     | Acceptée               |
| **Date**       | 2025-07-18             |
| **Auteurs**    | Équipe KRAAK           |
| **Dépendance** | —                      |
| **Liée à**     | ARC-02, ARC-03, ARC-04 |

---

## 1 · Contexte

KRAAK est une organisation qui opère sur trois pôles de services — **Formation**,
**Gestion de projet** et **Conseil en immigration** — avec un besoin de présence
numérique crédible, performante et évolutive.

Le MVP cible un **site vitrine** responsive, orienté conversion, complété à terme
par une **application mobile** participante et une **API back-end** unifiée. Les
contraintes principales sont :

- équipe restreinte (un développeur principal) ;
- budget d'infrastructure limité (BaaS préféré à l'auto-hébergement) ;
- besoin de SEO solide pour le site vitrine ;
- besoin mobile natif à moyen terme (notifications push, accès hors-ligne) ;
- cohérence maximale entre web et mobile via un socle partagé.

---

## 2 · Décision

Adopter une architecture **monorepo** organisée comme suit :

| Couche            | Choix technologique                                    |
| ----------------- | ------------------------------------------------------ |
| Frontend web      | Angular (workspace) + PrimeNG + Tailwind CSS v4        |
| Frontend mobile   | Ionic Angular + Capacitor (dans le même workspace)     |
| Backend / API     | NestJS (REST, dans `apps/api`)                         |
| BaaS / Base       | Supabase (PostgreSQL managé, Auth, Storage, RLS)       |
| Notifications     | Firebase Cloud Messaging (FCM) via Capacitor           |
| Analytics         | PostHog ou Google Analytics (léger, MVP seulement)     |
| Déploiement web   | Render (prerendering statique, SSR si nécessaire)      |
| Déploiement API   | Render (Docker)                                        |
| Packages partagés | `packages/tokens`, `contracts`, `domain`, `api-client` |

### Structure du dépôt

```text
apps/
  client/              # workspace Angular
    projects/
      web/             # site vitrine (PrimeNG + Tailwind)
      mobile/          # app participante (Ionic + Capacitor)
  api/                 # NestJS
packages/
  tokens/              # design tokens partagés
  contracts/           # DTOs et schémas Zod partagés
  domain/              # logique métier sans framework
  api-client/          # helpers typés de consommation API
supabase/
  migrations/          # scripts SQL versionnés
docs/
  context/             # artefacts de cadrage
  decisions/           # ADR formels
  specs/               # spécifications techniques
  runbooks/            # guides opérationnels
```

---

## 3 · Justification

### 3.1 Principes structurants

1. **Frontend unique** — Un seul workspace Angular héberge web et mobile. Les
   projets restent séparés pour leurs UI respectives mais partagent services,
   modèles et logique métier.
2. **Web et mobile séparés en UI, unifiés en socle** — PrimeNG + Tailwind pour
   le web, Ionic pour le mobile, mais mêmes services et mêmes contrats API.
3. **Backend unique NestJS** — Un seul serveur API expose les routes REST
   consommées par le web et le mobile.
4. **BaaS ciblé sans ORM** — Supabase fournit Auth, Storage, Realtime et RLS
   sans imposer un ORM lourd. Le client Supabase JS est utilisé directement.

### 3.2 Comparaison des alternatives évaluées

| Critère                    | Monorepo Angular + NestJS + Supabase | Next.js + Supabase | Flutter + NestJS |
| -------------------------- | ------------------------------------ | ------------------ | ---------------- |
| Compétence équipe          | ✅ Forte                             | ⚠️ Moyenne         | ❌ Faible        |
| SEO natif                  | ✅ Prerender Angular                 | ✅ SSR natif       | ❌ Web limité    |
| Mobile natif               | ✅ Ionic + Capacitor                 | ⚠️ PWA seulement   | ✅ Natif         |
| Partage de code web/mobile | ✅ Services Angular partagés         | ❌ Pas de partage  | ✅ Dart unifié   |
| Complexité infrastructure  | ✅ Simple (Render)                   | ✅ Simple          | ⚠️ Moyenne       |
| Écosystème composants UI   | ✅ PrimeNG mature                    | ✅ Large choix     | ⚠️ Plus jeune    |

---

## 4 · Implémentation

### 4.1 Contraintes dures

- **Pas d'ORM** : aucun ORM n'est ajouté par défaut. Si un besoin justifié se
  présente, une décision explicite sera documentée dans un ADR dédié.
- **Style composants** : Tailwind CSS utilitaire uniquement, pas de fichiers
  `.scss` / `.css` par composant, pas de `styleUrls` dans `@Component`.
- **Langue** : code en anglais, documentation et contenu en français.
- **TDD obligatoire** : cycle RED → GREEN → REFACTOR pour tout code de
  fonctionnalité ou correction.
- **Prerendering** : les pages vitrine utilisent `RenderMode.Prerender` (voir
  ARC-03).
- **Branches courtes** : une seule branche par tâche, merge rapide vers `main`
  (voir ARC-02).

### 4.2 Contrats et flux de données

```text
Client (web / mobile)
  ↕  HTTP REST (DTOs Zod validés via packages/contracts)
NestJS API (apps/api)
  ↕  Supabase JS client (requêtes directes, pas d'ORM)
PostgreSQL (Supabase)
  ↕  RLS policies (sécurité au niveau ligne)
Auth (Supabase Auth)
```

### 4.3 Déploiement

- **Web** : Render, `outputDirectory: apps/client/dist/web/browser`
- **API** : Render, conteneur Docker depuis `apps/api/Dockerfile`
- **Base** : Supabase Cloud, migrations versionnées dans `supabase/migrations/`

---

## 5 · Alternatives considérées

1. **Next.js full-stack** — Rejeté : compétence Angular plus forte dans l'équipe,
   pas de partage de code natif avec le mobile.
2. **Flutter pour web + mobile** — Rejeté : SEO web très limité, compétence Dart
   absente.
3. **Backend serverless pur (Supabase Edge Functions)** — Rejeté : logique métier
   trop couplée au BaaS, difficulté de test et de migration.
4. **Monorepo Nx** — Évalué puis écarté au profit d'un workspace Angular natif +
   pnpm workspaces, suffisant pour la taille actuelle du projet.

---

## 6 · Limites et évolutions

- **LMS complet** : reporté en V1.1+. Le MVP ne couvre pas le suivi de
  progression détaillé ni la certification.
- **CRM avancé** : scoring de leads et automatisations marketing hors périmètre
  MVP.
- **Multi-tenant** : pas de besoin actuel. L'architecture reste mono-tenant.
- **ORM** : si la complexité des requêtes augmente significativement en V1.1+, un
  ORM pourra être introduit via un ADR dédié.

---

## 7 · Références

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — document source validé
- [ARC-03 — Stratégie SEO et prerendering](./ARC-03-seo-prerender-strategy.md)
- [ARC-04 — Modèles de données MVP](./ARC-04-modeles-donnees-mvp.md)
- [docs/architecture/OVERVIEW.md](../architecture/OVERVIEW.md)
- [docs/product/MVP_SCOPE.md](../product/MVP_SCOPE.md)
