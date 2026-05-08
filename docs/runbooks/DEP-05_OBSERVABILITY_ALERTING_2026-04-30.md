# DEP-05 - Observabilite et alerting minimum

Date: 2026-04-30  
Issue: #122  
Epic: DEP

## Objectif

Finaliser un minimum exploitable d observabilite pour le pilote KRAAK sans
ajouter d infrastructure externe supplementaire:

- un signal de sante API exploitable par machine et par humain
- un check automatise des endpoints publics issus de DEP-02 et DEP-03
- un mecanisme d alerte minimal traçable dans GitHub

## Dependances

- DEP-02: satisfaite
  - le site public est deja deployee via Vercel
  - URL publique documentee: `https://kraak-consulting.vercel.app`
- DEP-03: satisfaite
  - l API est deja deployee via Render
  - endpoint de sante declare dans `render.yaml` via `healthCheckPath: /health`

## Portee DEP-05

Cette tache couvre:

- enrichissement de `GET /health` avec des metadonnees d exploitation
- script repo `pnpm check:observability` pour verifier web + API
- workflow GitHub Actions `Observability` lance toutes les 15 minutes et a la demande
- ouverture/mise a jour d une issue GitHub d alerte lors d une indisponibilite
- fermeture automatique de l issue d alerte lors du retour au vert

Cette tache ne couvre pas:

- APM complet ou tracing distribue
- centralisation de logs externe
- paging temps reel hors GitHub

## Contrat de sante API

`GET /health` renvoie maintenant un payload minimum de supervision:

```json
{
  "status": "ok",
  "service": "kraak-api",
  "environment": "production",
  "timestamp": "2026-04-30T09:45:00.000Z",
  "version": "pilot-2026-04-30",
  "uptimeSeconds": 321
}
```

Usage:

- `status` et `service` servent au check automatise
- `environment` evite les confusions local/staging/pilot
- `version` permet de corréler un incident a une release
- `uptimeSeconds` aide a distinguer un redemarrage recent d une degradation longue

## Workflow d alerte minimum

Fichier: `.github/workflows/observability.yml`

Comportement:

1. toutes les 15 minutes, le workflow execute deux checks (staging puis production)
2. pour chaque environnement, le workflow verifie la home web et `GET /health`
3. en cas d echec, il ouvre (ou met a jour) une issue dediee a l environnement
4. quand les checks repassent au vert, le workflow commente puis ferme l issue dediee

Valeurs versionnees actuellement dans le workflow:

- staging
  - `KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app` (aucune URL web staging stable ; les previews Vercel changent a chaque commit et le branch alias a SSO)
  - `KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com`
  - issue: `[ALERT][DEP-05][staging] Observability check failure`
- production
  - `KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app`
  - `KRAAK_OBSERVABILITY_API_URL=https://kraak-api-prod.onrender.com`
  - issue: `[ALERT][DEP-05][production] Observability check failure`

## Exploitation manuelle

Commande locale ou CI:

```bash
KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app \
KRAAK_OBSERVABILITY_API_URL=https://kraak-api-prod.onrender.com \
pnpm check:observability
```

Commande pour la cible staging:

```bash
KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app \
KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com \
pnpm check:observability
```

Sortie attendue:

- `web-home: 200`
- `api-health: 200`
- resume incluant `env=` et `version=` pour l API

## Checklist de validation DEP-05

- [x] Contrat `/health` enrichi et documente
- [x] Check scriptable web + API ajoute
- [x] Workflow GitHub planifie ajoute
- [x] Alerte GitHub minimale ouverte/fermee automatiquement
- [x] Variables et runbook mis a jour
- [x] Preuves de validation ajoutees

## Artefacts de preuve

- `docs/runbooks/evidence/DEP-05_observability-alerting-evidence_2026-04-30.md`
- `docs/runbooks/ENVIRONMENT_VARIABLES.md`
- `.github/workflows/observability.yml`

## Risques residuels

- L alerte depend encore des notifications GitHub et non d un canal paging dedie.
- Le web est valide sur la home publique, pas sur un endpoint de sante dedie cote Vercel.
- La valeur `APP_VERSION` doit etre renseignee cote Render pour etre pleinement utile.

## Prochaine etape

- DEP-06: capitaliser sur cette base pour formaliser incident response, rollback et pilot checklist.
