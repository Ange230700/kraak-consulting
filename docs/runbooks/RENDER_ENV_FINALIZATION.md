# Finalisation manuelle des variables Render

Ce runbook décrit la procédure manuelle dans le dashboard Render pour finaliser
une mise à jour d'environnement après rotation de secret, changement d'URL, ou
correction de configuration.

Contexte KRAAK au 2 juin 2026 :

- API staging : `kraak-api-staging`
- API production : `kraak-api-prod`
- Web staging : `kraak-web-staging`
- Web production : `kraak-web-prod`

## Chemin exact dans le dashboard

Pour modifier les variables d'un service Render :

1. Ouvrir `https://dashboard.render.com/`
2. Sélectionner le service concerné
3. Cliquer sur `Environment` dans le panneau de gauche
4. Aller à la section `Environment Variables`
5. Modifier ou ajouter la variable
6. Choisir l'option de sauvegarde adaptée

Options de sauvegarde à utiliser :

- service API Docker : `Save and deploy`
- site web statique : `Save, rebuild, and deploy`
- `Save only` uniquement si l'on prépare une vague de changements sans cutover immédiat

## Ordre d'exécution recommandé

1. Finaliser `kraak-api-staging`
2. Vérifier `/health` et les logs staging
3. Finaliser `kraak-web-staging` si une variable web a changé
4. Reproduire ensuite sur `kraak-api-prod`
5. Finaliser `kraak-web-prod` si une variable web a changé

## Version ultra courte pour ticket d'incident

Version fusionnée avec Supabase disponible dans
[`INCIDENT_SECRET_ROTATION_COMMENT_TEMPLATE.md`](INCIDENT_SECRET_ROTATION_COMMENT_TEMPLATE.md).

```text
Render dashboard > service > Environment > Environment Variables

[ ] API staging (`kraak-api-staging`)
[ ] Vérifier / remplacer : SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, CORS_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGIN_PATTERNS
[ ] Save and deploy
[ ] Vérifier https://kraak-api-staging.onrender.com/health + logs

[ ] Web staging (`kraak-web-staging`) si impact front
[ ] Vérifier / remplacer : CLIENT_API_BASE_URL, CLIENT_FEATURE_PARTICIPANT_AREA, CLIENT_SITE_URL
[ ] Save, rebuild, and deploy
[ ] Vérifier la home + appels API

[ ] API prod (`kraak-api-prod`)
[ ] Vérifier / remplacer : SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, CORS_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGIN_PATTERNS
[ ] Save and deploy
[ ] Vérifier https://kraak-api-prod.onrender.com/health + logs

[ ] Web prod (`kraak-web-prod`) si impact front
[ ] Vérifier / remplacer : CLIENT_API_BASE_URL, CLIENT_FEATURE_PARTICIPANT_AREA, CLIENT_SITE_URL
[ ] Save, rebuild, and deploy
[ ] Vérifier la home + appels API
```

## API staging

### Service cible API staging

- `kraak-api-staging`
- Dashboard : `Render Dashboard` > `kraak-api-staging` > `Environment`

### Variables à vérifier pour l'API staging

Variables déclarées dans `render.yaml` pour ce service :

- `NODE_ENV=production`
- `PORT=3000`
- `APP_VERSION`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_ORIGIN_PATTERNS`

### Valeurs à contrôler en priorité pour l'API staging

- `SUPABASE_URL` pointe vers le projet staging attendu
- `SUPABASE_SECRET_KEY` est la nouvelle valeur active staging
- `SUPABASE_PUBLISHABLE_KEY` correspond au même projet Supabase que l'URL
- `RESEND_API_KEY` est la nouvelle clé active staging
- `CONTACT_FROM_EMAIL` et `CONTACT_TO_EMAIL` restent cohérents avec l'exploitation KRAAK
- `CORS_ALLOWED_ORIGINS` contient au minimum les surfaces web réellement utilisées
- `CORS_ALLOWED_ORIGIN_PATTERNS` couvre les previews Vercel si elles restent autorisées

### Validation après sauvegarde pour l'API staging

1. Attendre le redeploy de `kraak-api-staging`
2. Vérifier `https://kraak-api-staging.onrender.com/health`
3. Vérifier les logs de démarrage Render
4. Confirmer l'absence d'erreurs `401`, `403`, `Invalid API key`, `CORS` ou `Missing env`

## API production

### Service cible API production

- `kraak-api-prod`
- Dashboard : `Render Dashboard` > `kraak-api-prod` > `Environment`

### Variables à vérifier pour l'API production

Variables déclarées dans `render.yaml` pour ce service :

- `NODE_ENV=production`
- `PORT=3000`
- `APP_VERSION`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_ORIGIN_PATTERNS`

### Valeurs à contrôler en priorité pour l'API production

- `SUPABASE_URL` pointe vers le projet production attendu
- `SUPABASE_SECRET_KEY` est la nouvelle valeur active production
- `SUPABASE_PUBLISHABLE_KEY` correspond au projet Supabase prod
- `RESEND_API_KEY` est la nouvelle clé active production
- `CONTACT_FROM_EMAIL` et `CONTACT_TO_EMAIL` sont conformes à la prod
- `CORS_ALLOWED_ORIGINS` n'autorise que les origines publiques attendues
- `CORS_ALLOWED_ORIGIN_PATTERNS` reste volontairement limité ou vide si inutile

### Validation après sauvegarde pour l'API production

1. Attendre le redeploy de `kraak-api-prod`
2. Vérifier `https://kraak-api-prod.onrender.com/health`
3. Vérifier les logs de démarrage Render
4. Confirmer l'absence d'erreurs d'auth Supabase, d'email transactionnel, ou de CORS

## Web staging

### Service cible web staging

- `kraak-web-staging`
- Dashboard : `Render Dashboard` > `kraak-web-staging` > `Environment`

### Variables à vérifier pour le web staging

Variables déclarées dans `render.yaml` pour ce service :

- `CLIENT_API_BASE_URL=https://kraak-api-staging.onrender.com`
- `CLIENT_FEATURE_PARTICIPANT_AREA=true`
- `CLIENT_SITE_URL`

### Valeurs à contrôler en priorité pour le web staging

- `CLIENT_API_BASE_URL` pointe bien vers `https://kraak-api-staging.onrender.com`
- `CLIENT_FEATURE_PARTICIPANT_AREA` reste aligné avec la stratégie staging
- `CLIENT_SITE_URL` correspond à l'URL publique réellement exposée

### Validation après sauvegarde pour le web staging

1. Lancer `Save, rebuild, and deploy`
2. Ouvrir la home staging
3. Vérifier que les appels API partent vers la bonne base URL
4. Vérifier qu'aucun écran critique ne casse au chargement

## Web production

### Service cible web production

- `kraak-web-prod`
- Dashboard : `Render Dashboard` > `kraak-web-prod` > `Environment`

### Variables à vérifier pour le web production

Variables déclarées dans `render.yaml` pour ce service :

- `CLIENT_API_BASE_URL=https://kraak-api-prod.onrender.com`
- `CLIENT_FEATURE_PARTICIPANT_AREA=false`
- `CLIENT_SITE_URL`

### Valeurs à contrôler en priorité pour le web production

- `CLIENT_API_BASE_URL` pointe bien vers `https://kraak-api-prod.onrender.com`
- `CLIENT_FEATURE_PARTICIPANT_AREA` reste aligné avec le périmètre public prod
- `CLIENT_SITE_URL` correspond à l'URL publique de production

### Validation après sauvegarde pour le web production

1. Lancer `Save, rebuild, and deploy`
2. Ouvrir la home production
3. Vérifier que les appels API partent vers la bonne base URL
4. Vérifier l'absence d'erreurs console bloquantes

## Check-list exécutable

### Check-list API staging

- [ ] Service `kraak-api-staging` ouvert dans `Environment`
- [ ] `SUPABASE_SECRET_KEY` vérifiée ou remplacée
- [ ] `RESEND_API_KEY` vérifiée ou remplacée
- [ ] `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` cohérents
- [ ] `CORS_ALLOWED_ORIGINS` et `CORS_ALLOWED_ORIGIN_PATTERNS` vérifiés
- [ ] `Save and deploy` exécuté
- [ ] `/health` et logs OK

### Check-list API production

- [ ] Service `kraak-api-prod` ouvert dans `Environment`
- [ ] `SUPABASE_SECRET_KEY` vérifiée ou remplacée
- [ ] `RESEND_API_KEY` vérifiée ou remplacée
- [ ] `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` cohérents
- [ ] `CORS_ALLOWED_ORIGINS` et `CORS_ALLOWED_ORIGIN_PATTERNS` vérifiés
- [ ] `Save and deploy` exécuté
- [ ] `/health` et logs OK

### Check-list web staging

- [ ] Service `kraak-web-staging` ouvert dans `Environment`
- [ ] `CLIENT_API_BASE_URL` vérifiée
- [ ] `CLIENT_SITE_URL` vérifiée
- [ ] `Save, rebuild, and deploy` exécuté si nécessaire
- [ ] Contrôle manuel de la home OK

### Check-list web production

- [ ] Service `kraak-web-prod` ouvert dans `Environment`
- [ ] `CLIENT_API_BASE_URL` vérifiée
- [ ] `CLIENT_SITE_URL` vérifiée
- [ ] `Save, rebuild, and deploy` exécuté si nécessaire
- [ ] Contrôle manuel de la home OK

## Points d'attention

- Les variables `sync: false` de `render.yaml` ne se remettent pas à jour toutes seules sur un service existant ; elles doivent être contrôlées manuellement dans le dashboard.
- Pour l'API, un changement de variable d'environnement ne nécessite pas de rebuild d'image ; un redeploy suffit.
- Pour le web statique, préférer un rebuild complet si la variable influence le build ou le runtime-config généré.
- Ne jamais coller une ancienne valeur par commodité sans vérifier qu'elle correspond bien au bon environnement staging ou production.
