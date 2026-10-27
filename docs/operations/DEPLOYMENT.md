---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Déploiement Render

## Table des matières

- [Déploiement Render](#deploiement-render)
  - [Configuration](#configuration)
  - [Avant et après déploiement](#avant-et-apres-deploiement)
  - [Retrait des anciennes ressources](#retrait-des-anciennes-ressources)

## Configuration

Le [Blueprint](../../render.yaml) ne déclare que `kraak-web-prod` et
`kraak-api-prod`, sur `main`, sans déploiement automatique. Le workflow
[Release Prod](../../.github/workflows/release-prod.yml) déploie un commit
épinglé par un tag SemVer déjà accessible depuis `main`.

- Web : build `pnpm build:web`, publication de
  `apps/client/dist/web/browser` dans `public`.
- API : image Docker construite avec `apps/api/Dockerfile`.
- Variables et secrets : [ENVIRONMENTS](ENVIRONMENTS.md).
- Validation de PR : services locaux et CI, sans infrastructure distante de test.

## Avant et après déploiement

1. Vérifier les contrôles requis de la PR et l’identité du commit.
2. Comparer les migrations avec la base cible, sans réparation automatique de
   l’historique ni rejeu aveugle.
3. Vérifier les identifiants Render, la branche `main` et les références Supabase
   de production à partir de l’état du fournisseur.
4. Suivre [RELEASE_PROD](RELEASE_PROD.md) et son approbation de production.
5. Vérifier `/health`, la version attendue, les pages localisées, le runtime
   client, CORS et les parcours autorisés avec des comptes de test.

Un HTTP 200 sur `/health` ne prouve ni le fonctionnement du web, ni Auth, ni
l’envoi d’e-mails. Ne pas envoyer de message de test à des destinataires réels
sans autorisation spécifique.

## Retrait des anciennes ressources

Voir le [registre de transition](PRODUCTION_ONLY_TRANSITION.md). La suppression
du Blueprint ne supprime pas les ressources déjà créées. Conserver les
ressources dont la sauvegarde, la propriété ou l’indépendance vis-à-vis de la
production n’est pas établie.
