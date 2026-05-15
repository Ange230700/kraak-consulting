# DEP-05 - Observabilité et alerting minimum

Date: 2026-04-30  
Issue: #122  
Epic: DEP

## Objectif

Finaliser un minimum exploitable d'observabilité pour le pilote KRAAK sans
ajouter d'infrastructure externe supplémentaire :

- un signal de santé API exploitable par machine et par humain
- un check automatisé des endpoints publics issus de DEP-02 et DEP-03
- un mécanisme d'alerte minimal traçable dans GitHub

## Dépendances

- DEP-02: satisfaite
  - le site public est déjà déployée via Vercel
  - URL publique documentée: `https://kraak-consulting.vercel.app`
- DEP-03: satisfaite
  - l'API est déjà déployée via Render
  - endpoint de santé déclaré dans `render.yaml` via `healthCheckPath: /health`

## Portée DEP-05

Cette tâche couvre:

- enrichissement de `GET /health` avec des métadonnées d'exploitation
- script repo `pnpm check:observability` pour vérifier web + API
- workflow GitHub Actions `Observability` lancé toutes les 15 minutes et à la demande
- ouverture/mise à jour d'une issue GitHub d'alerte lors d'une indisponibilité
- fermeture automatique de l'issue d'alerte lors du retour au vert

Cette tâche ne couvre pas:

- APM complet ou tracing distribué
- centralisation de logs externe
- paging temps réel hors GitHub

## Contrat de santé API

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

- `status` et `service` servent au check automatisé
- `environment` évite les confusions local/staging/pilot
- `version` permet de corréler un incident à une release
- `uptimeSeconds` aide à distinguer un redémarrage récent d'une dégradation longue

## Workflow d'alerte minimum

Fichier: `.github/workflows/observability.yml`

Comportement:

1. toutes les 15 minutes, le workflow exécute deux checks (staging puis production)
2. pour chaque environnement, le workflow vérifie la home web et `GET /health`
3. en cas d'échec, il ouvre (ou met à jour) une issue dédiée à l'environnement
4. quand les checks repassent au vert, le workflow commente puis ferme l'issue dédiée

Valeurs versionnées actuellement dans le workflow:

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
- résumé incluant `env=` et `version=` pour l'API

## Checklist de validation DEP-05

- [x] Contrat `/health` enrichi et documenté
- [x] Check scriptable web + API ajouté
- [x] Workflow GitHub planifié ajouté
- [x] Alerte GitHub minimale ouverte/fermée automatiquement
- [x] Variables et runbook mis a jour
- [x] Preuves de validation ajoutées

## Artefacts de preuve

- `docs/runbooks/evidence/DEP-05_observability-alerting-evidence_2026-04-30.md`
- `docs/runbooks/ENVIRONMENT_VARIABLES.md`
- `.github/workflows/observability.yml`

## Risques résiduels

- L'alerte dépend encore des notifications GitHub et non d'un canal paging dédié.
- Le web est valide sur la home publique, pas sur un endpoint de santé dédié côté Vercel.
- La valeur `APP_VERSION` doit être renseignée côté Render pour être pleinement utile.

## Prochaine étape

- DEP-06: capitaliser sur cette base pour formaliser incident response, rollback et pilot checklist.
