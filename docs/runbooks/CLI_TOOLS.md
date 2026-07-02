# CLI_TOOLS — Outils en ligne de commande Render, Supabase et GitHub

> Référence opérationnelle pour installer, authentifier et utiliser les CLI
> Render, Supabase et GitHub (`gh`) sur un poste de développement
> (Windows / macOS / Linux). Conçu pour permettre à un mainteneur (ou à un
> agent IA) d'inspecter et d'opérer la stack de déploiement et le dépôt
> GitHub sans passer par les dashboards web.

Voir aussi : [`STAGING_PROMOTION`](STAGING_PROMOTION.md),
[`RELEASE_PROD`](RELEASE_PROD.md),
[`ENVIRONMENT_VARIABLES`](ENVIRONMENT_VARIABLES.md),
[`NIGHTLY_REGRESSION`](NIGHTLY_REGRESSION.md),
[`ARC-08-staging-environment`](../decisions/ARC-08-staging-environment.md),
[`ARC-09-inversion-main-staging`](../decisions/ARC-09-inversion-main-staging.md),
[`ARC-07-prod-release-tag-based`](../decisions/ARC-07-prod-release-tag-based.md).

---

## 1 · Versions cibles

| CLI        | Version minimale | Rôle                                                                                     |
| ---------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `render`   | 2.16.x           | Inspection services Render (`kraak-api-staging`, `kraak-api-prod`)                       |
| `supabase` | 2.90.x           | Migrations SQL, génération de types, gestion des projets `kraak-staging` et `kraak-prod` |
| `gh`       | 2.88.x           | Issues, PR, GitHub Projects, branch protection, `gh api` arbitraire                      |

Mettre à jour régulièrement (Supabase notifie spontanément les nouvelles
versions au lancement).

---

## 2 · Installation

### 2.1 Supabase CLI

- **Windows (Scoop, recommandé)** :

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

- **macOS / Linux (Homebrew)** :

  ```bash
  brew install supabase/tap/supabase
  ```

- **Alternative portable** : télécharger l'exécutable depuis
  <https://github.com/supabase/cli/releases>, le placer dans un dossier du
  `PATH` (ex. `C:\Users\<user>\bin`).

> ⚠️ Ne **pas** installer le paquet npm `supabase` — il est officiellement
> déprécié pour l'usage CLI.

### 2.2 Render CLI

Render distribue un binaire Go autonome. Il n'existe pas de paquet npm officiel
(certains stubs npm existants sont des scripts qui s'auto-invoquent et bouclent
à l'infini — ne pas les utiliser).

- **Windows** :

  ```bash
  # Récupérer le tag courant
  TAG=$(curl -fsSL https://api.github.com/repos/render-oss/cli/releases/latest \
    | grep '"tag_name"' | head -1 | sed -E 's/.*"v?([^"]+)".*/\1/')
  cd /tmp
  curl -fsSL -o render.zip \
    "https://github.com/render-oss/cli/releases/download/v${TAG}/cli_${TAG}_windows_amd64.zip"
  unzip -o render.zip
  mv -f "cli_v${TAG}.exe" "/c/Users/$USER/bin/render.exe"
  ```

- **macOS / Linux** :

  ```bash
  brew install render
  ```

Vérifier :

```bash
render --version
```

> ℹ️ Sur Windows / Git Bash, `render` est une **TUI** : si la commande hang
> sans sortie, c'est que stdout n'est pas un vrai TTY. Utiliser `cmd //c
"render ..."` ou exporter `RENDER_API_KEY` puis ajouter `-o json` aux
> sous-commandes pour le mode non-interactif.

---

## 3 · Authentification

Trois modes possibles selon le contexte. **Aucun secret ne doit être commité**
— stocker les tokens dans le gestionnaire de secrets local ou dans une variable
d'environnement utilisateur.

### 3.1 Mode interactif (poste de dev humain)

```bash
supabase login      # demande de coller un Personal Access Token
render login        # ouvre le navigateur (OAuth)
```

### 3.2 Mode token (agents IA, scripts, CI)

| Variable                | CLI consommatrice                                     | Où la générer                                      |
| ----------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `RENDER_API_KEY`        | `render` (lue automatiquement en mode non-interactif) | <https://dashboard.render.com/u/settings#api-keys> |
| `SUPABASE_ACCESS_TOKEN` | `supabase` (lue automatiquement)                      | <https://supabase.com/dashboard/account/tokens>    |

Définition (Git Bash / PowerShell utilisateur) :

```bash
# Bash (~/.bashrc ou ~/.profile)
export SUPABASE_ACCESS_TOKEN="..."
export RENDER_API_KEY="..."
```

```powershell
# PowerShell utilisateur (persistant)
[Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', '...', 'User')
[Environment]::SetEnvironmentVariable('RENDER_API_KEY', '...', 'User')
```

### 3.3 Permissions minimales

- **Render** : API key au scope du compte (granularité limitée côté Render).
- **Supabase** : token utilisateur (PAT) — n'a accès qu'aux organisations dont
  l'utilisateur est membre.

---

## 4 · Liaison des projets locaux

### 4.1 Render

Lier le workspace `apps/client` au projet Render existant :

```bash
cd apps/client
render link
# Sélectionner : team kraak  →  projet du site web
```

Le lien est stocké dans `.render/project.json` (déjà ignoré par `.gitignore`).

### 4.2 Supabase

Lier le projet local au projet distant `kraak-staging` :

```bash
supabase link --project-ref <ref-staging>
```

Pour basculer vers `kraak-prod` :

```bash
supabase link --project-ref <ref-prod>
```

Le `project-ref` est visible dans l'URL du dashboard
(`https://supabase.com/dashboard/project/<ref>`).

### 4.3 Render

Render ne supporte pas la liaison locale. Les commandes prennent un
`--service-id` (visible dans l'URL d'un service Render).

---

## 5 · Commandes utiles

### 5.1 Render

```bash
render ls                              # lister les déploiements récents
render logs <deployment-url>           # logs runtime d'un déploiement
render env ls                          # variables d'environnement du projet
render inspect <deployment-url>        # détails (build, sources, etc.)
```

### 5.2 Render

```bash
render services -o json                # lister les services (mode non-interactif)
render deploys list <service-id> -o json
render logs <service-id> --tail
```

### 5.3 Supabase

```bash
supabase migration list                # historique migrations local vs distant
supabase db push                       # appliquer les migrations en attente
supabase db pull                       # récupérer le schéma distant
supabase db advisors --local           # Splinter local (sécurité + performance)
supabase db advisors --linked          # Splinter sur le projet Supabase lié
supabase db advisors --linked --type security --level warn --fail-on warn
                                       # Splinter sécurité (échec si WARN/ERROR)
supabase db advisors --linked --type performance --level warn --fail-on warn
                                       # Splinter performance (échec si WARN/ERROR)
supabase gen types typescript --linked > packages/contracts/src/db.types.ts
supabase functions list                # edge functions
```

### Splinter (Supabase Postgres LINTER)

`supabase db advisors` est le point d'entrée CLI pour les contrôles Splinter.

- Le mode `--local` nécessite la stack locale Supabase démarrée.
- Le mode `--linked` s'exécute contre le projet Supabase lié (staging ou prod selon le `project-ref` actif).
- Le script racine `pnpm splinter:linked` est bloquant sur les erreurs seulement ; `pnpm splinter:linked:warnings` sert à relire les advisories de niveau warning.

Scripts racine prêts à l'emploi:

```bash
pnpm splinter:local
pnpm splinter:linked
pnpm splinter:security:linked
pnpm splinter:performance:linked
```

### 5.4 Newman / régression API

```bash
pnpm test:api:journey                  # collection Newman CI-ready (strictAuth=false)
pnpm test:api:journey:strict           # contrat nominal strict en local (strictAuth=true)
pnpm test:api:journey:strict:staging   # contrat strict contre l'API staging
```

Utilisation recommandée:

- La CI principale et les vérifications rapides utilisent `pnpm test:api:journey`.
- Le workflow nocturne `Nightly Regression` utilise `pnpm test:api:journey:strict:staging`.
- `pnpm test:api:journey:strict` sert à reproduire localement le contrat nominal strict avant d'ouvrir ou de corriger un ticket de régression.

---

## 6 · Vérification post-installation

```bash
render --version    # attendu : 53.x
supabase --version  # attendu : 2.90.x ou plus
cmd //c "render --version"  # Windows / Git Bash, attendu : v2.16.x
```

Si les trois commandes répondent et que `render whoami` /
`supabase projects list` / `render services -o json` réussissent, l'environnement
est prêt.

---

## 7 · Anti-patterns

- ❌ Installer `supabase` via `npm i -g supabase` → paquet déprécié.
- ❌ Installer `render` via un wrapper npm douteux → certains stubs sont des
  scripts bash qui s'auto-invoquent et hanguent indéfiniment.
- ❌ Commiter `.render/`, `.supabase/`, `supabase/.temp/` ou tout fichier
  contenant un token → vérifier `.gitignore`.
- ❌ Partager un token via chat, ticket ou commit → uniquement gestionnaire de
  secrets ou variable d'env locale.
- ❌ Utiliser `render login` interactif dans un script CI → préférer
  `RENDER_API_KEY`.
- ❌ Modifier les règles de branch protection via l'UI GitHub → utiliser le
  script `scripts/github/update-branch-protection.mjs` pour rester
  reproductible (cf. ARC-09).

---

## 8 · GitHub CLI (`gh`)

### 8.1 Installation

| OS      | Commande                                                           |
| ------- | ------------------------------------------------------------------ |
| Windows | `winget install --id GitHub.cli` (PowerShell admin)                |
| macOS   | `brew install gh`                                                  |
| Linux   | Voir <https://github.com/cli/cli/blob/trunk/docs/install_linux.md> |

Vérification : `gh --version` doit afficher au moins `2.88.x`.

### 8.2 Authentification

Mode interactif (poste de dev) :

```bash
gh auth login           # choisir GitHub.com, HTTPS, Login with browser
gh auth status          # vérifier compte, scopes et active account
```

Scopes minimaux requis pour ce dépôt :

- `repo` — lecture / écriture du code, des PR et des branches
- `workflow` — relancer des runs CI / éditer `.github/workflows`
- `read:org` — lire les équipes et permissions
- `project` — lire / écrire les GitHub Projects (cycle de vie obligatoire
  défini dans `AGENTS.md`)
- `gist` — facultatif

Mode non-interactif (CI ou agent) :

```bash
echo "$GITHUB_TOKEN" | gh auth login --with-token
```

### 8.3 Configuration locale du dépôt

Une seule fois après clone :

```bash
gh repo set-default Ange230700/kraak-consulting
```

Si le `git remote` pointe encore vers l'ancienne URL `kraak-group.git`
(observable via le warning « This repository moved » au push), le mettre à
jour :

```bash
git remote set-url origin https://github.com/Ange230700/kraak-consulting.git
```

### 8.4 Commandes utiles

```bash
# Issues
gh issue list --state open
gh issue create --title "..." --body "..." --label "..."
gh issue close <num> --comment "..."

# Pull requests
gh pr create --base staging --head feat/x --title "..." --body-file pr_body.txt
gh pr view <num> --json state,mergeable,mergeStateStatus,statusCheckRollup
gh pr merge <num> --rebase --delete-branch
gh pr checks <num>

# Branch protection (lecture)
gh api repos/Ange230700/kraak-consulting/branches/main/protection
gh api repos/Ange230700/kraak-consulting/branches/staging/protection

# Branch protection (écriture — TOUJOURS via le script ARC-09)
node scripts/github/update-branch-protection.mjs --dry-run
node scripts/github/update-branch-protection.mjs

# GitHub Projects (cycle de vie obligatoire AGENTS.md)
gh project item-list <project-number> --owner Ange230700
gh project item-edit --id <item-id> --field-id <field-id> --single-select-option-id <opt-id>
```

### 8.5 Convention de cible des PR (ARC-09)

- Branches courtes (`feat/*`, `fix/*`, `chore/*`, …) → PR vers **`staging`**.
- Release prod → PR `staging → main`, puis tag SemVer sur `main` (ARC-07).
- Aucune PR ne doit cibler `main` directement, sauf release.
