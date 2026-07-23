---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Déploiement Render

Ce runbook décrit le déploiement courant du web Angular prerender et de l'API
NestJS sur Render. L'ancienne bascule vers Render est conservée dans
[`../archive/deployment-transition/`](../archive/deployment-transition/).

## 1 · Cadrage technique

- Le front web est un build statique prerender généré dans
  `apps/client/dist/web/browser`, puis copié vers `public` pour publication
  Render (`staticPublishPath: public`).
- La generation de config runtime est exécutée pendant le build via `build:web:staging` et `build:web`.
- Les services Render cibles sont définis dans `render.yaml` :
  - `kraak-web-staging` (autoDeploy sur `staging`)
  - `kraak-web-prod` (branch `main`, autoDeploy désactivé)
- L'API reste sur Render (`kraak-api-staging`, `kraak-api-prod`).

## 2 · Variables d'environnement Render (web)

Configurer ces variables sur les services static site Render :

- `CLIENT_API_BASE_URL`
  - staging : `https://kraak-api-staging.onrender.com`
  - prod : `https://kraak-api-prod.onrender.com`
- `CLIENT_FEATURE_PARTICIPANT_AREA`
  - staging : `true`
  - prod : `false`
- `CLIENT_SITE_URL`
  - staging : URL publique Render staging (ou domaine staging custom)
  - prod : URL domaine public final

Important : `CLIENT_SITE_URL` est nécessaire pour éviter les canonicals/URLs SEO pointant encore vers Render.

Le sous-domaine Render doit rester activé pour `kraak-web-prod` jusqu'à ce que
`https://kraak-web-prod.onrender.com` retourne HTTP 200. Le site legacy externe
reste le fallback public tant que ce critère et `GET
https://kraak-api-prod.onrender.com/health` ne sont pas verts.

## 3 · Stratégie de transition recommandée

1. Provisionner `kraak-web-staging` sur Render avec autoDeploy actif.
2. Verifier le site staging Render avec smoke tests (routes publiques + contact + SEO).
3. Garder l'environnement web historique actif en parallèle pendant la phase de validation.
4. Mettre a jour DNS staging vers Render uniquement apres validation complete.
5. Provisionner `kraak-web-prod` sur Render (autoDeploy: false).
6. Executer un dry-run de build/déploiement prod sur Render.
7. Basculer le domaine prod vers Render en fenêtre de changement.
8. Garder l'environnement web historique en fallback public tant que
   `kraak-web-prod.onrender.com` ou `kraak-api-prod.onrender.com/health` ne
   retournent pas HTTP 200.

## 4 · Checklist de validation staging (obligatoire)

- [ ] Home `200`, contenu visible, aucune erreur console bloquante.
- [ ] Routes vitrine : `/a-propos`, `/services`, `/programmes`, `/contact`.
- [ ] Route ressources : `/ressources`.
- [ ] Formulaire contact : erreur de validation attendue et soumission valide.
- [ ] Balises SEO : canonical et Open Graph resolvent le domaine Render staging.
- [ ] `robots.txt` et `sitemap.xml` accessibles et cohérents.
- [ ] Appels API vers `kraak-api-staging` (pas de CORS bloquant).

## 5 · Rollback rapide

Si incident apres bascule DNS :

1. Repointer le domaine vers l'environnement web historique.
2. Conserver Render actif pour diagnostic.
3. Corriger la configuration (souvent `CLIENT_SITE_URL`, headers, CORS API) puis retester.
4. Rebasculer DNS uniquement apres validation smoke complete.

## 6 · Notes opérationnelles

- Les outils Render API peuvent exiger une workspace active avant creation de service.
- Si la creation via API retourne `no workspace set`, sélectionner d'abord la workspace Render cible puis relancer la creation des services.
- Ne pas désactiver l'environnement web historique avant validation complète des
  services Render production web et API.
