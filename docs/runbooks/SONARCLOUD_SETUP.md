# Runbook — Configuration SonarQube Cloud & SonarLint

Ce runbook décrit la configuration de **SonarQube Cloud** (analyse côté CI) et
**SonarLint** (analyse côté éditeur) pour le monorepo `kraak-group`.

## Métadonnées du projet

- **Organisation SonarCloud** : `ange230700`
- **Project key** : `Ange230700_kraak-group`
- **Région** : EU
- **Host URL** : `https://sonarcloud.io`

## Fichiers de configuration

| Fichier                            | Rôle                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| `sonar-project.properties`         | Périmètre, exclusions, chemins de couverture         |
| `.sonarlint/connectedMode.json`    | Liaison SonarLint -> SonarCloud (mode connecté)      |
| `.github/workflows/sonarcloud.yml` | Job CI exécutant `sonarqube-scan-action`             |
| `.vscode/extensions.json`          | Recommandation de l'extension SonarLint              |
| `.gitignore`                       | Ignore `.scannerwork/` et la config locale SonarLint |

## Mise en service côté SonarCloud

1. Se connecter à <https://sonarcloud.io> avec le compte GitHub `Ange230700`.
2. Importer le dépôt `Ange230700/kraak-group` dans l'organisation
   `ange230700`.
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
2. Au premier lancement, SonarLint détecte `.sonarlint/connectedMode.json`
   et propose la liaison ; accepter.
3. Fournir un token utilisateur SonarCloud quand demandé (stocké localement).
4. Vérifier dans la barre d'état VS Code la mention "SonarLint connected".

## Couverture de code

Les chemins LCOV attendus par SonarCloud sont déclarés dans
`sonar-project.properties`. Pour qu'ils existent au moment du scan :

- `apps/api` : `pnpm --filter @kraak/api test -- --coverage`
- `apps/client` (web/mobile) : configurer le builder Vitest avec
  `--coverage` quand un rapport est requis.
- `packages/*` : `pnpm -r test -- --coverage` (Vitest).

L'exécution de la couverture **dans la CI** sera ajoutée dans une tâche
ultérieure dédiée ; le job `sonarcloud.yml` actuel se contente du scan
statique. L'absence de fichier LCOV n'échoue pas le scan : SonarCloud
ignore simplement les chemins absents.

## Validation locale (optionnel)

```bash
# Avec un token local (ne jamais committer)
SONAR_TOKEN=*** SONAR_HOST_URL=https://sonarcloud.io \
  pnpm sonar
```

## Bootstrap local automatique du token (recommande)

Objectif: charger automatiquement `SONAR_TOKEN` sans variable globale Windows.

1. Creer un fichier local non versionne a la racine:
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

1. Redemarrer le terminal (ou VS Code) puis verifier:
   - Git Bash: `echo "$SONAR_TOKEN"`
   - PowerShell: `echo $env:SONAR_TOKEN`

## Points d'attention

- Le périmètre exclut `dist/`, `coverage/`, `playwright-report/`, les
  fichiers générés (`runtime-config.js`) et les artefacts Mermaid.
- Les fichiers `*.spec.ts` / `*.test.*` sont déclarés en tests (exclus de
  la couverture mais analysés pour les anti-patterns de test).
- Toute modification du périmètre doit être reflétée dans
  `sonar-project.properties` **et** dans ce runbook.
