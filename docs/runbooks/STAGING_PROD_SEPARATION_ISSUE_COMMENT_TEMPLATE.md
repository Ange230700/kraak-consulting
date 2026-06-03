# Modèle de commentaire d'issue — preuve d'execution

Copier-coller ce bloc dans un commentaire d'issue GitHub pour tracer officiellement la separation staging/prod.

```md
## Preuve d'execution — separation staging/prod

Date: YYYY-MM-DD
Opérateur: @Ange230700
Depot: Ange230700/kraak-consulting
Runbook applique: docs/runbooks/STAGING_PROD_SEPARATION_30MIN.md

### 1) GitHub

- [ ] Environment `production` mis a jour
  - Required reviewers: `kraakconsulting`
  - `Ange230700` conserve ses droits admin
  - Capture: <ajouter image ou lien>
- [ ] Ruleset tags `v*` actif
  - Creation/update tag SemVer autorisée pour `kraakconsulting` et `Ange230700`
  - Capture: <ajouter image ou lien>
- [ ] Protection de branche: `Require review from Code Owners` activée
  - Branches vérifiées: `staging` (et `main` si applicable)
  - Capture: <ajouter image ou lien>

### 2) Render

- [ ] Services staging verifies
  - `kraak-web-staging`: droits gestion confirms pour `Ange230700`
  - `kraak-api-staging`: droits gestion confirms pour `Ange230700`
  - Capture(s): <ajouter image ou lien>
- [ ] Services prod verifies
  - `kraak-web-prod`: ownership compte GitHub `kraakconsulting`
  - `kraak-api-prod`: ownership compte GitHub `kraakconsulting`
  - `Ange230700` conserve les droits admin
  - Capture(s): <ajouter image ou lien>

- [ ] Ownership staging/prod confirme
  - staging (Render + Supabase): compte GitHub `Ange230700`
  - prod (Render + Supabase): compte GitHub `kraakconsulting`
  - Capture(s): <ajouter image ou lien>

### 3) Vercel

- [ ] Droit de déploiement Production vérifié
  - Projet prod rattaché à `kraakconsulting`
  - Projet staging rattaché à `Ange230700`
  - `Ange230700` conserve les droits admin
  - Capture: <ajouter image ou lien>
- [ ] Vérification `Production Branch`
  - Conforme au flux actuel (pas de changement disruptif)
  - Capture: <ajouter image ou lien>

### 4) Validation opérationnelle

- [ ] Test gate release prod effectué
  - Workflow: `Release Prod`
  - Statut attendu: bloque sur l'approbation environment `production`
  - `kraakconsulting` est approbateur présent
  - `Ange230700` conserve les droits admin sur l'environnement
  - Lien Action: <coller URL du run GitHub Actions>
- [ ] Test staging non regressif effectué
  - Auto-déploiement OK sur `kraak-web-staging` et `kraak-api-staging`
  - Healthcheck OK: https://kraak-api-staging.onrender.com/health
  - Liens de déploiement: <Render web staging>, <Render api staging>

### 5) Résultat

- [ ] Separation appliquée sans rupture de flux.
- [ ] Exploitation staging pilotée par `Ange230700`.
- [ ] Exploitation prod pilotée par `kraakconsulting`.
- [ ] Droits admin globaux conservés pour `Ange230700`.

### 6) Liens utiles

- Runbook: docs/runbooks/STAGING_PROD_SEPARATION_30MIN.md
- Workflow prod: .github/workflows/release-prod.yml
- CODEOWNERS: .github/CODEOWNERS
```
