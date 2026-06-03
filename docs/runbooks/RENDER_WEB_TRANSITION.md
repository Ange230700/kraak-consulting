# RENDER_WEB_TRANSITION — Migration du front web vers Render

> Objectif : basculer l’hébergement du site web Angular prerender de Vercel vers Render, sans interruption de service et avec rollback rapide.

## 1 · Cadrage technique

- Le front web est un build statique prerender publie depuis `apps/client/dist/web/browser`.
- La generation de config runtime est exécutée pendant le build via `build:web:staging` et `build:web`.
- Les services Render cibles sont définis dans `render.yaml` :
  - `kraak-web-staging` (autoDeploy sur `staging`)
  - `kraak-web-prod` (autoDeploy désactivé)
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

Important : `CLIENT_SITE_URL` est nécessaire pour éviter les canonicals/URLs SEO pointant encore vers Vercel.

## 3 · Stratégie de transition recommandée

1. Provisionner `kraak-web-staging` sur Render avec autoDeploy actif.
2. Verifier le site staging Render avec smoke tests (routes publiques + contact + SEO).
3. Garder Vercel staging actif en parallèle pendant la phase de validation.
4. Mettre a jour DNS staging vers Render uniquement apres validation complete.
5. Provisionner `kraak-web-prod` sur Render (autoDeploy: false).
6. Executer un dry-run de build/déploiement prod sur Render.
7. Basculer le domaine prod vers Render en fenêtre de changement.
8. Garder Vercel en mode rollback court terme (24-72h), puis décommissionner.

## 4 · Checklist de validation staging (obligatoire)

- [ ] Home `200`, contenu visible, aucune erreur console bloquante.
- [ ] Routes vitrine : `/a-propos`, `/services`, `/programmes`, `/contact`.
- [ ] Route blog : listing et article.
- [ ] Formulaire contact : erreur de validation attendue et soumission valide.
- [ ] Balises SEO : canonical et Open Graph resolvent le domaine Render staging.
- [ ] `robots.txt` et `sitemap.xml` accessibles et cohérents.
- [ ] Appels API vers `kraak-api-staging` (pas de CORS bloquant).

## 5 · Rollback rapide

Si incident apres bascule DNS :

1. Repointer le domaine vers Vercel.
2. Conserver Render actif pour diagnostic.
3. Corriger la configuration (souvent `CLIENT_SITE_URL`, headers, CORS API) puis retester.
4. Rebasculer DNS uniquement apres validation smoke complete.

## 6 · Notes opérationnelles

- Les outils Render API peuvent exiger une workspace active avant creation de service.
- Si la creation via API retourne `no workspace set`, sélectionner d'abord la workspace Render cible puis relancer la creation des services.
- Ne pas désactiver Vercel avant validation complete des parcours critiques sur Render.
