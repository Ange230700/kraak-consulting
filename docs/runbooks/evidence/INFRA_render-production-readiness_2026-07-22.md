# INFRA - Render production readiness

Date: 2026-07-22
Branche: `fix/infra-render-production-readiness`
Issue principale: [#608](https://github.com/Ange230700/kraak-consulting/issues/608)
Défaut séparé: [#618](https://github.com/Ange230700/kraak-consulting/issues/618)

## Constat initial vérifié

Commandes:

```bash
curl.exe -sS -I https://kraak-web-staging.onrender.com
curl.exe -sS -L -o NUL -w "%{http_code} %{content_type} %{url_effective}\n" https://kraak-web-prod.onrender.com/
curl.exe -sS https://kraak-api-staging.onrender.com/health
curl.exe -sS https://kraak-api-prod.onrender.com/health
```

Résultats observés:

- `kraak-web-staging.onrender.com`: HTTP 200
- `kraak-web-prod.onrender.com`: HTTP 404 sur GET `/`
- `kraak-api-staging.onrender.com/health`: HTTP 200, mais
  `environment=production`
- `kraak-api-prod.onrender.com/health`: HTTP 200, `environment=production`,
  `version=v1.1.6`

## Diagnostic CI

- `Observability` échoue sur les jobs staging et production avant publication
  de logs exploitables (`steps=[]`, aucun runner attaché dans les métadonnées du
  run).
- `Nightly Regression` échoue sur `Newman strict (staging API)` avec le même
  symptôme côté logs GitHub (`steps=[]`).
- Reproduction locale Nightly:
  `pnpm.cmd test:api:journey:strict:staging` échoue car
  `test-results/postman/api-user-journey.collection.json` est absent.
- Les secrets du GitHub Environment `production` contiennent
  `RENDER_PROD_SERVICE_ID`, mais pas `RENDER_PROD_WEB_SERVICE_ID`, alors que le
  job `deploy-render-web` en dépend.

## Corrections repo

- `/health` utilise désormais `APP_ENV` avant `NODE_ENV`.
- `render.yaml` déclare `APP_ENV=staging` et `APP_ENV=production` pour les API
  Render.
- `kraak-web-staging` et `kraak-web-prod` déclarent `staticPublishPath: public`.
- `kraak-web-prod` garde explicitement le sous-domaine Render activé.
- `release-prod.yml` met à jour `APP_ENV=production` et smoke-test
  `environment=production`.
- `release-prod.yml` échoue désormais explicitement si les secrets Render
  obligatoires pour l'API ou le web prod sont absents.
- `check-observability.mjs` exécute réellement son entrée CLI sous Node et
  compare `/health.environment` à `KRAAK_OBSERVABILITY_ENVIRONMENT`.

## Limites de vérification

- Le Render CLI n'est pas installé dans l'environnement local.
- `RENDER_API_KEY` n'est pas présent dans l'environnement local.
- La navigation vers le dashboard Render a expiré depuis l'outil navigateur.
- Les variables Render réellement présentes dans le dashboard n'ont donc pas pu
  être vérifiées ni modifiées depuis cette session.
