# CLI_TOOLS — Outils en ligne de commande Vercel, Render et Supabase

> Référence opérationnelle pour installer, authentifier et utiliser les CLI
> Vercel, Render et Supabase sur un poste de développement (Windows / macOS /
> Linux). Conçu pour permettre à un mainteneur (ou à un agent IA) d'inspecter
> et d'opérer la stack de déploiement sans passer par les dashboards web.

Voir aussi : [`STAGING_PROMOTION`](STAGING_PROMOTION.md),
[`RELEASE_PROD`](RELEASE_PROD.md),
[`ENVIRONMENT_VARIABLES`](ENVIRONMENT_VARIABLES.md),
[`ARC-08-staging-environment`](../decisions/ARC-08-staging-environment.md),
[`ARC-07-prod-release-tag-based`](../decisions/ARC-07-prod-release-tag-based.md).

---

## 1 · Versions cibles

| CLI        | Version minimale | Rôle                                                                                     |
| ---------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `vercel`   | 53.x             | Inspection / déclenchement déploiements web Vercel                                       |
| `render`   | 2.16.x           | Inspection services Render (`kraak-api-staging`, `kraak-api-prod`)                       |
| `supabase` | 2.90.x           | Migrations SQL, génération de types, gestion des projets `kraak-staging` et `kraak-prod` |

Mettre à jour régulièrement (Supabase notifie spontanément les nouvelles
versions au lancement).

---

## 2 · Installation

### 2.1 Vercel CLI (Node.js, multi-plateforme)

```bash
pnpm add -g vercel
vercel --version
```

### 2.2 Supabase CLI

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

### 2.3 Render CLI

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
vercel login        # ouvre le navigateur (OAuth)
supabase login      # demande de coller un Personal Access Token
render login        # ouvre le navigateur (OAuth)
```

### 3.2 Mode token (agents IA, scripts, CI)

| Variable                | CLI consommatrice                                     | Où la générer                                      |
| ----------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `VERCEL_TOKEN`          | `vercel` (avec `--token "$VERCEL_TOKEN"`)             | <https://vercel.com/account/tokens>                |
| `SUPABASE_ACCESS_TOKEN` | `supabase` (lue automatiquement)                      | <https://supabase.com/dashboard/account/tokens>    |
| `RENDER_API_KEY`        | `render` (lue automatiquement en mode non-interactif) | <https://dashboard.render.com/u/settings#api-keys> |

Définition (Git Bash / PowerShell utilisateur) :

```bash
# Bash (~/.bashrc ou ~/.profile)
export VERCEL_TOKEN="..."
export SUPABASE_ACCESS_TOKEN="..."
export RENDER_API_KEY="..."
```

```powershell
# PowerShell utilisateur (persistant)
[Environment]::SetEnvironmentVariable('VERCEL_TOKEN', '...', 'User')
[Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', '...', 'User')
[Environment]::SetEnvironmentVariable('RENDER_API_KEY', '...', 'User')
```

### 3.3 Permissions minimales

- **Vercel** : token `Full Access` scope `kraak` team uniquement.
- **Supabase** : token utilisateur (PAT) — n'a accès qu'aux organisations dont
  l'utilisateur est membre.
- **Render** : API key au scope du compte (granularité limitée côté Render).

---

## 4 · Liaison des projets locaux

### 4.1 Vercel

Lier le workspace `apps/client` au projet Vercel existant :

```bash
cd apps/client
vercel link
# Sélectionner : team kraak  →  projet du site web
```

Le lien est stocké dans `.vercel/project.json` (déjà ignoré par `.gitignore`).

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

### 5.1 Vercel

```bash
vercel ls                              # lister les déploiements récents
vercel logs <deployment-url>           # logs runtime d'un déploiement
vercel env ls                          # variables d'environnement du projet
vercel inspect <deployment-url>        # détails (build, sources, etc.)
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
supabase gen types typescript --linked > packages/contracts/src/db.types.ts
supabase functions list                # edge functions
```

---

## 6 · Vérification post-installation

```bash
vercel --version    # attendu : 53.x
supabase --version  # attendu : 2.90.x ou plus
cmd //c "render --version"  # Windows / Git Bash, attendu : v2.16.x
```

Si les trois commandes répondent et que `vercel whoami` /
`supabase projects list` / `render services -o json` réussissent, l'environnement
est prêt.

---

## 7 · Anti-patterns

- ❌ Installer `supabase` via `npm i -g supabase` → paquet déprécié.
- ❌ Installer `render` via un wrapper npm douteux → certains stubs sont des
  scripts bash qui s'auto-invoquent et hangent indéfiniment.
- ❌ Commiter `.vercel/`, `.supabase/`, `supabase/.temp/` ou tout fichier
  contenant un token → vérifier `.gitignore`.
- ❌ Partager un token via chat, ticket ou commit → uniquement gestionnaire de
  secrets ou variable d'env locale.
- ❌ Utiliser `render login` interactif dans un script CI → préférer
  `RENDER_API_KEY`.
