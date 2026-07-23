---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-02 — Conventions dépôt et workflow Git

| Champ          | Valeur       |
| -------------- | ------------ |
| **Statut**     | Acceptée     |
| **Date**       | 2025-07-18   |
| **Auteurs**    | Équipe KRAAK |
| **Dépendance** | ARC-01       |
| **Liée à**     | ARC-05       |

---

## 1 · Contexte

Un projet monorepo multi-applications nécessite des conventions strictes pour
garantir la lisibilité de l'historique Git, la traçabilité des changements, et la
cohérence du workflow entre contributeurs humains et assistants IA.

Sans conventions explicites, les risques sont :

- historique Git illisible (messages incohérents, branches longues durée) ;
- conflits de merge fréquents ;
- régressions silencieuses sans validation automatisée ;
- dérive de périmètre non traçable.

---

## 2 · Décision

Adopter un ensemble de conventions couvrant le nommage des branches, le format
des commits, les hooks Git automatisés, et le workflow de contribution.

### 2.1 Nommage des branches

Format : `<type>/<sujet-court>`

Types autorisés : `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`,
`style`, `perf`, `revert`, `build`.

Validation automatique via `validate-branch-name` au pre-push.

Pattern regex : `^(main|(feat|fix|chore|docs|test|refactor|ci|style|perf|revert|build)/.+)$`

### 2.2 Format des commits

[Conventional Commits](https://www.conventionalcommits.org/) obligatoire avec
scope.

Format : `<type>(<scope>): <description>`

Scopes autorisés : `root`, `repo`, `workspace`, `config`, `docs`, `scripts`,
`web`, `mobile`, `api`, `client`, `contracts`, `domain`, `api-client`, `tokens`,
`infra`, `ci`, `supabase`.

Outil interactif : `pnpm commit` (Commitizen).

### 2.3 Hooks Git (Husky)

| Hook         | Outil                   | Action                                |
| ------------ | ----------------------- | ------------------------------------- |
| `commit-msg` | commitlint              | Valide le format Conventional Commits |
| `pre-commit` | Prettier                | Formate le code modifié               |
| `pre-push`   | validate-branch-name    | Vérifie le nom de branche             |
| `pre-push`   | TypeScript typecheck ×3 | Vérifie web, mobile, API              |
| `pre-push`   | Jest + Vitest           | Exécute les tests unitaires           |

### 2.4 Workflow Git

1. Récupérer le dernier `main`.
2. Créer une branche courte (`<type>/<sujet>`).
3. Implémenter le plus petit incrément viable.
4. Commiter avec le format Conventional Commits.
5. Pousser la branche et créer la PR.
6. Valider (hooks automatiques + revue).
7. Fusionner dans `main` (rebase uniquement — historique linéaire obligatoire).
8. Supprimer la branche locale et distante.
9. Mettre à jour l'issue et le Project GitHub.

### 2.5 Politique de langue

- **Anglais** : noms de variables, fonctions, types, classes, fichiers,
  identifiants, clés techniques, schémas.
- **Français** : documentation, specs, runbooks, contenus UI, labels, messages,
  commentaires de code, corps de réponses API destinés à l'utilisateur.

---

## 3 · Justification

| Critère                  | Conventional Commits + Husky | Commits libres | Squash-only       |
| ------------------------ | ---------------------------- | -------------- | ----------------- |
| Lisibilité historique    | ✅ Structuré et filtrable    | ❌ Anarchique  | ⚠️ Perd le détail |
| Changelog automatique    | ✅ Possible                  | ❌ Impossible  | ⚠️ Partiel        |
| Détection de régressions | ✅ Hooks pre-push            | ❌ Manuelle    | ❌ Manuelle       |
| Courbe d'apprentissage   | ⚠️ Moyenne                   | ✅ Nulle       | ✅ Faible         |
| Compatibilité CI         | ✅ Excellente                | ⚠️ Fragile     | ✅ Bonne          |

L'historique linéaire (rebase-only) sur `main` est imposé par la protection de
branche GitHub pour garantir un historique propre et bisectable.

---

## 4 · Implémentation

### 4.1 Fichiers de configuration

- `commitlint.config.js` — règles Conventional Commits + scopes autorisés
- `.husky/commit-msg` — hook commitlint
- `.husky/pre-commit` — hook Prettier
- `.husky/pre-push` — hook validate-branch-name + typecheck + tests
- `.validate-branch-namerc.json` — pattern de validation des noms de branche
- `.prettierrc` / `.prettierignore` — configuration Prettier

### 4.2 Scripts pnpm

```jsonc
{
  "commit": "cz", // commitizen interactif
  "format": "prettier --write .", // formatage global
  "format:check": "prettier --check .",
}
```

### 4.3 Protection de branche GitHub

- Branche `main` protégée avec historique linéaire obligatoire.
- Merge commits interdits — seul le rebase est autorisé.

---

## 5 · Alternatives considérées

1. **Pas de convention de commit** — Rejeté : historique illisible, changelog
   impossible, difficulté de diagnostic.
2. **Merge commits autorisés** — Rejeté : historique non linéaire, bisect
   difficile, graphe Git complexe.
3. **Trunk-based sans branche** — Écarté : trop risqué sans CI/CD mature et
   feature flags. Les branches courtes offrent un bon compromis.
4. **Monorepo Nx avec générateurs** — Écarté : surcharge d'outillage non
   justifiée pour la taille actuelle du projet.

---

## 6 · Limites et évolutions

- **CI/CD** : les hooks locaux ne remplacent pas une pipeline CI complète.
  L'ajout d'une CI GitHub Actions est prévu mais hors périmètre de cet ADR.
- **Changelog automatique** : possible via `conventional-changelog` mais non
  encore activé.
- **Scopes** : la liste des scopes pourra évoluer si de nouveaux packages ou
  applications sont ajoutés au monorepo.
- **Revue de code** : actuellement informelle (équipe d'un développeur). Une
  politique de revue formelle sera définie si l'équipe s'agrandit.

---

## 7 · Références

- [CONTRIBUTING.md](../../CONTRIBUTING.md) — guide de contribution complet
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky](https://typicode.github.io/husky/)
- [commitlint](https://commitlint.js.org/)
- [validate-branch-name](https://github.com/JsonMa/validate-branch-name)
- [ARC-01 — Architecture cible MVP](./ARC-01-architecture-cible-mvp.md)
