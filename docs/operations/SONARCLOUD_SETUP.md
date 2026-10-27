---
status: active
owner: platform
last_reviewed: 2026-10-26
source_of_truth: true
---

# Runbook — Configuration SonarQube Cloud & SonarLint

## Table des matières

- [Runbook — Configuration SonarQube Cloud & SonarLint](#runbook-configuration-sonarqube-cloud-sonarlint)
  - [Métadonnées du projet](#metadonnees-du-projet)
  - [Fichiers de configuration](#fichiers-de-configuration)
  - [Mise en service côté SonarCloud](#mise-en-service-cote-sonarcloud)
  - [Mise en service côté SonarLint (VS Code)](#mise-en-service-cote-sonarlint-vs-code)
  - [Couverture de code](#couverture-de-code)
    - [Politique d'exclusion pragmatique](#politique-dexclusion-pragmatique)
  - [Validation locale (optionnel)](#validation-locale-optionnel)
  - [Bootstrap local automatique du token (recommande)](#bootstrap-local-automatique-du-token-recommande)
    - [Git Bash (/.bashrc)](#git-bash-bashrc)
    - [PowerShell ($PROFILE)](#powershell-profile)
  - [Points d'attention](#points-dattention)

Ce runbook décrit la configuration de **SonarQube Cloud** (analyse côté CI) et
**SonarLint** (analyse côté éditeur) pour le monorepo `kraak-consulting`.

## Métadonnées du projet

- **Dépôt GitHub** : `Ange230700/kraak-consulting`
- **Package/workspace racine** : `kraak-consulting`
- **Organisation SonarCloud** : `ange230700`
- **Project key** : `Ange230700_kraak-consulting`
- **Project name** : `kraak-consulting`
- **Branche principale Sonar** : `main`
- **Région** : EU
- **Host URL** : `https://sonarcloud.io`

La CI et SonarLint ciblent le projet Sonar existant `kraak-consulting`. Un ancien
ciblage ne mettait pas à jour ce tableau public. Vérifier
le SHA et la date de l'analyse avant de comparer les mesures globales.
Suivi du rétablissement des mesures et de leur assainissement : #722.

## Fichiers de configuration

| Fichier                            | Rôle                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| `sonar-project.properties`         | Périmètre, exclusions, chemins de couverture         |
| `.vscode/settings.json`            | Liaison SonarLint -> SonarCloud (mode connecté)      |
| `.github/workflows/sonarcloud.yml` | Contrôles, couverture et scan via `pnpm sonar`       |
| `.vscode/extensions.json`          | Recommandation de l'extension SonarLint              |
| `.gitignore`                       | Ignore `.scannerwork/` et la config locale SonarLint |

## Mise en service côté SonarCloud

1. Se connecter à <https://sonarcloud.io> avec le compte GitHub `Ange230700`.
2. Ouvrir le projet existant `Ange230700_kraak-consulting` dans l'organisation
   `ange230700`, sans créer un second projet ni réinitialiser l'historique.
3. Choisir le mode d'analyse **CI-based** (et non l'analyse automatique).
4. Générer un **token utilisateur** (Account > Security) puis l'ajouter au
   dépôt GitHub :
   - Settings > Secrets and variables > Actions > New repository secret
   - Nom : `SONAR_TOKEN`
   - Valeur : token généré
5. Vérifier que la **Quality Gate** par défaut (`Sonar way`) est appliquée.
6. Activer la règle "Clean as You Code" sur le code nouveau.

## Mise en service côté SonarLint (VS Code)

1. Installer l'extension recommandée `SonarSource.sonarlint-vscode`.
2. Au premier lancement, SonarLint détecte la configuration connectée dans
   `.vscode/settings.json` et propose la liaison ; accepter.
3. Fournir un token utilisateur SonarCloud quand demandé (stocké localement).
4. Vérifier dans la barre d'état VS Code la mention "SonarLint connected".

## Couverture de code

Les huit chemins LCOV attendus sont déclarés dans
`sonar-project.properties`. `pnpm coverage` les génère à partir de c8
(scripts et configuration racine), Jest (API) et Vitest (web, mobile et
quatre packages). La CI exécute `pnpm check` avant le scan, avec les seuils
de 100 % par fichier, et conserve les rapports en artefacts.

La commande `pnpm sonar` normalise automatiquement les chemins `SF:` des
fichiers `lcov.info` en chemins POSIX relatifs au dépôt (ex:
`apps/client/projects/web/src/...`) avant de lancer `sonar-scanner`. Cette
normalisation évite les incohérences SonarCloud liées aux chemins Windows avec
anti-slash.

La même commande réinitialise aussi `./.scannerwork/scanner-report` avant le
scan. Cette étape évite les erreurs intermittentes Windows du type
`Unable to write measure ... measures-*.pb` et
`Unable to write messages ... syntax-highlightings-*.pb`.

Un verrou local `./.scannerwork/sonarcloud-scan.lock` est aussi posé pendant
le scan. Si un second `pnpm sonar` démarre en parallèle, il échoue rapidement
avec un message explicite au lieu de perturber le scan déjà actif.

Mode diagnostic strict (optionnel) :

- Activer avec `SONAR_STRICT_DIAGNOSTIC=true`.
- Le script surveille `./.scannerwork/scanner-report` pendant le run et arrête
  immédiatement le scanner si le dossier disparaît.
- Un log horodaté minimal est écrit dans
  `./.scannerwork/sonar-strict-diagnostic.log`.
- Le chemin du log peut être surchargé avec
  `SONAR_STRICT_DIAGNOSTIC_LOG=<chemin>`.

`pnpm sonar` refuse un rapport manquant ou vide. Les mesures globales
n'apparaissent qu'après une analyse CI de la branche principale Sonar
`main` : une analyse de PR ne remplace pas cette analyse de branche.
Vérifier dans le log du scan le projet, les huit rapports importés et les
éventuels chemins non résolus. Le type généré `db.types.ts` est hors périmètre.

Pour constater une dette globale nulle, sélectionner le workflow SonarCloud
déclenché par un **push** sur `main`, et non le scan de PR (y compris celui
de la PR de release). Lire `api/project_analyses/search` avec
`project=Ange230700_kraak-consulting&branch=main&ps=1` et vérifier que
`revision` correspond au SHA intégré. Lire ensuite les anomalies ouvertes,
`duplicated_lines_density` et `coverage` dans ce même contexte de branche.
Les mesures d'une PR et son arbre limité aux fichiers modifiés ne constituent
pas une preuve des mesures globales.

### Politique d'exclusion pragmatique

Objectif: stabiliser le signal qualité sans masquer la logique métier.

- Les tests, templates HTML et types générés sont hors couverture.
- Les modules Nest et la configuration runtime restent couverts, comme les
  autres fichiers de production.
- Les services, contrôleurs, DTO de validation, règles métier et parcours
  utilisateur restent dans le périmètre de couverture et doivent être testés.
- Aucun fichier de production n'est exclu du calcul de duplication.
- Les migrations PostgreSQL ne doivent pas être interprétées comme du PL/SQL
  Oracle. Elles sont validées par les contrôles SQL et le rejeu du schéma,
  et non par un analyseur d'un autre dialecte.

## Validation locale (optionnel)

```bash
# Avec un token local (ne jamais committer)
SONAR_TOKEN=*** SONAR_HOST_URL=https://sonarcloud.io \
  pnpm sonar
```

## Bootstrap local automatique du token (recommande)

Objectif: charger automatiquement `SONAR_TOKEN` sans variable globale Windows.

1. Créer un fichier local non versionne a la racine:
   - Copier `.env.local.example` vers `.env.local`
   - Renseigner `SONAR_TOKEN`
2. Ajouter le chargement au profil shell.

La commande `pnpm sonar` utilise ensuite `scripts/sonarcloud-scan.mjs`, qui
lit `.env.local` automatiquement et lance `sonar-scanner` via `pnpm`.

### Git Bash (`~/.bashrc`)

```bash
if [[ -f "$HOME/kraak-consulting/scripts/local/load-env-local.sh" ]]; then
  source "$HOME/kraak-consulting/scripts/local/load-env-local.sh"
fi
```

### PowerShell (`$PROFILE`)

```powershell
$loader = Join-Path $HOME "kraak-consulting/scripts/local/load-env-local.ps1"
if (Test-Path $loader) {
  . $loader
}
```

1. Redémarrer le terminal (ou VS Code) puis vérifier la présence du token
   sans afficher sa valeur :
   - Git Bash : `test -n "$SONAR_TOKEN" && echo "Token configuré"`
   - PowerShell : `if ($env:SONAR_TOKEN) { "Token configuré" }`

## Points d'attention

- Le périmètre exclut `dist/`, `coverage/`, `playwright-report/`, les
  fichiers générés (`runtime-config.js`) et les artefacts Mermaid.
- Les fichiers `*.spec.ts` / `*.test.*` sont déclarés en tests (exclus de
  la couverture mais analysés pour les anti-patterns de test).
- Toute modification du périmètre doit être reflétée dans
  `sonar-project.properties` **et** dans ce runbook.
