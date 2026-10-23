---
status: active
owner: platform
last_reviewed: 2026-10-23
source_of_truth: true
---

# Nightly Regression

## Table des matières

- [Nightly Regression](#nightly-regression)
  - [Objectif](#objectif)
  - [Déclenchement](#declenchement)
  - [Workflow](#workflow)
  - [Règles d'usage](#regles-dusage)

Ce runbook décrit le workflow nocturne de régression pour la collection Newman `api-user-journey`.

Voir aussi : [`CLI_TOOLS`](CLI_TOOLS.md),
[`QAT-05_REGRESSION_2026-04-30`](../archive/pilot-2026-04/QAT-05_REGRESSION_2026-04-30.md).

## Objectif

Garder un signal de régression strict sur l'API staging sans alourdir la CI principale des pull requests.

## Déclenchement

- Exécution automatique chaque nuit à `02:00 UTC`
- Déclenchement manuel via `workflow_dispatch`

## Workflow

Fichier: [.github/workflows/nightly-regression.yml](../../.github/workflows/nightly-regression.yml)

Le job exécute la collection Newman en mode strict contre `https://kraak-api-staging.onrender.com` via le script:

```bash
export KRAAK_JOURNEY_BASE_URL=https://kraak-api-staging.onrender.com
export KRAAK_JOURNEY_EMAIL="<compte staging confirmé>"
export KRAAK_JOURNEY_PASSWORD="<mot de passe du compte>"
pnpm test:api:journey:strict:staging
```

Le workflow utilise l'environnement GitHub `staging` et ses secrets
`KRAAK_JOURNEY_EMAIL` et `KRAAK_JOURNEY_PASSWORD` (ou les secrets de dépôt
homonymes). Le compte doit être confirmé dans Supabase staging et disposer des
accès participant attendus par la collection. Aucun compte réel ne doit être
versionné. Le runner refuse une configuration manquante avant toute requête.

Le mode strict utilise `useExistingConfirmedUser=true` : il ne crée pas un
nouvel utilisateur non confirmé à chaque nuit. Les identifiants passent par
l'API Node de Newman, pas par les arguments de commande affichés dans les logs.
Chaque requête est bornée à soixante secondes, la collection à trois minutes
et le job à dix minutes. Les réponses HTTP 401/500 inattendues restent des
échecs ; elles ne sont pas transformées en succès.

La collection source est versionnée dans
[`apps/api/test/collections/api-user-journey.collection.json`](../../apps/api/test/collections/api-user-journey.collection.json).
Newman est épinglé dans les dépendances de développement racine et installé par
`pnpm-lock.yaml`. Les commandes locales utilisent `pnpm exec` et le runner
staging utilise l'API Node de Newman, sans téléchargement à la volée.
Les commandes locales non staging peuvent générer un rapport JSON sous
`test-results/postman/` ; ce rapport n'est jamais utilisé comme entrée.

Le script staging génère aussi `test-results/postman/api-user-journey.junit.xml`.
Le workflow publie uniquement ce rapport JUnit dans l'artefact
`newman-strict-staging`, conservé sept jours, même si des assertions échouent.
Le nightly ne génère pas de JSON brut : celui-ci peut contenir des identifiants,
des jetons ou des corps de requêtes et de réponses. Si la configuration échoue
avant le démarrage de Newman, aucun rapport n'est attendu et l'étape d'upload
est ignorée ; l'erreur de configuration reste bloquante.
Un échec d'assertion conserve son statut bloquant ; la publication du rapport
ne transforme pas le run en succès.

## Règles d'usage

- La CI principale exécute les contrôles de code et les tests E2E bloquants sans
  dépendre des identifiants staging.
- Le nightly regression sert à détecter les écarts nominaux sur Auth et les régressions API plus tardives.
- Les échecs du workflow nocturne doivent être investigués avant la prochaine fenêtre de livraison.
- Un `/health` à HTTP 200 ne garantit pas l'envoi d'e-mails : si `/contact`
  retourne HTTP 500, consulter les logs Render et vérifier `RESEND_API_KEY`,
  `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` et la validation du domaine expéditeur
  Resend. Ne pas accepter HTTP 500 dans la collection pour masquer ce problème.
- Si les requêtes privées échouent après connexion, vérifier les droits du
  compte confirmé et l'application des migrations staging. Une erreur
  `SUPABASE_DB_URL_STAGING` dans le guard nécessite de rétablir le secret de
  l'environnement staging ; ne jamais réutiliser un accès production.
