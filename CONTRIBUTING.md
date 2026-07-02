<!-- CONTRIBUTING.md -->

# Guide de contribution

Ce document explique comment contribuer au dépôt KRAAK Group.

---

## Branches

`main` et `staging` sont les seules branches permanentes. Toute modification passe par une branche courte.

### Nommage

```text
<type>/<sujet-court>
```

Types autorisés :

| Préfixe     | Usage                                           |
| ----------- | ----------------------------------------------- |
| `feat/`     | Nouvelle fonctionnalité                         |
| `fix/`      | Correction de bug                               |
| `docs/`     | Documentation seule                             |
| `chore/`    | Maintenance, dépendances                        |
| `test/`     | Ajout ou modification de tests                  |
| `refactor/` | Refactorisation sans changement de comportement |
| `style/`    | Formatage, espaces, points-virgules             |
| `perf/`     | Amélioration de performance                     |
| `ci/`       | CI/CD (GitHub Actions, Render)                  |
| `build/`    | Build system, scripts                           |
| `revert/`   | Annulation d'un changement                      |

**Exemples :**

```bash
git checkout -b feat/contact-form
git checkout -b fix/api-cors-error
git checkout -b docs/update-readme
```

> Le hook `pre-push` vérifie automatiquement le nommage de la branche. Un nom invalide bloque le push.

---

## Nommage Angular (Pages Et Composants)

Pour les applications client Angular (`web` et `mobile`) :

- une page complète doit être nommée en `*.page.{ts,html,spec.ts}`
- un composant destiné à être intégré dans une page doit être nommé en
  `*.component.{ts,html,spec.ts}`

Cette convention est obligatoire pour tout nouveau fichier et pour toute mise en
conformité des fichiers existants.

---

## Règles Transverses de Qualité et de Maintenabilité (Obligatoires)

1. **Chemins d'import explicites** :

- Utiliser uniquement des chemins d'import explicites (relatifs ou alias documenté) dans tout le code Angular/TypeScript.
- Ne jamais s'appuyer sur des index.ts implicites sauf si l'alias est stable et documenté.
- Objectif : éviter les dépendances circulaires et faciliter la navigation.

1. **Aucun catch silencieux** :

- Tout bloc try/catch doit logguer l'erreur capturée (avec contexte) via Console.
- Ne jamais laisser un catch vide ou avec un simple commentaire.

1. **Nommage de tests Given/When/Then** :

- Tous les tests (unitaires, intégration, E2E) doivent utiliser une formulation Given/When/Then dans la description.
- Les fichiers de test doivent respecter le nom du fichier testé (ex : foo.service.ts → foo.service.spec.ts).

1. **Pas de code mort** :

- Tout code commenté doit être supprimé avant merge.
- Si un code est laissé pour plus tard, ajouter un TODO avec référence issue/JIRA.

1. **Lint/format strict sur CI** :

- Linting (ESLint, Prettier, markdownlint) et type-checking obligatoires en CI avant merge.

1. **Aucun style direct dans les templates** :

- Ne jamais utiliser d'attribut `style` ou de balise `style` dans les templates Angular.
- Tout style doit passer par Tailwind ou les styles globaux.

1. **Versionning API/DTO** :

- Tout changement de contrat API/DTO doit être versionné ou documenté dans un changelog, et les consommateurs mis à jour.

1. **Aucun secret/URL en dur** :

- Toute clé, secret ou URL d'environnement doit passer par une variable d'environnement ou un fichier de config, jamais en dur dans le code.

1. **Accessibilité par défaut** :

- Tout nouveau composant/page UI doit inclure au moins une validation d'accessibilité (aria-label, navigation clavier, contraste).

1. **Documentation à jour** :

- Tout changement d'architecture ou de process doit être répercuté dans la doc Markdown dans le même commit que le code.

---

## Commits (Conventional Commits)

Chaque message de commit suit le format [Conventional Commits](https://www.conventionalcommits.org/) :

```text
<type>(<scope>): <description courte>
```

**Exemples :**

```text
feat(web): ajouter la page d'accueil
fix(api): corriger le CORS pour /contact
docs(docs): mettre à jour le README
chore(repo): mettre à jour les dépendances pnpm
test(api): ajouter un test pour le service contact
```

> Le hook `commit-msg` valide automatiquement le format via **commitlint**. Un commit mal formaté sera rejeté.

### Types de commit

Ce sont les mêmes que les préfixes de branche : `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `style`, `perf`, `ci`, `build`, `revert`.

### Scope (obligatoire)

Indique la partie du projet concernée. Scopes autorisés :
`root`, `repo`, `workspace`, `config`, `docs`, `scripts`, `web`, `mobile`,
`api`, `client`, `contracts`, `domain`, `api-client`, `tokens`, `infra`, `ci`.

### Prompt interactif avec Commitizen

Pour créer un commit avec un assistant interactif, utiliser :

```bash
pnpm commit
```

Le prompt propose les types et scopes autorisés, puis génère un message compatible
avec `commitlint`.

---

## Règle Documentation

Toute modification du codebase qui rend un document inexact, incomplet ou
ambigu impose une mise à jour de la documentation dans le même changement.

Cela couvre notamment :

- les chemins et la structure du dépôt
- les scripts et commandes de travail
- les variables d'environnement
- les comportements visibles et contrats techniques
- les conventions Git, de test ou de déploiement

Ne pas remettre une mise à jour documentaire nécessaire à plus tard.

---

## Règle Debug

En phase de débogage ou d’investigation, utiliser régulièrement les méthodes de
l’objet `Console` (`console.debug`, `console.info`, `console.warn`,
`console.error`) pour tracer les étapes clés et accélérer le diagnostic.

Quand un flux applicatif intercepte une erreur, un rejet, ou un état inattendu
sans le relancer, laisser une trace via les méthodes de l’objet `Console`
(`console.error`, `console.warn`, `console.info`, `console.debug`) avec un
contexte bref et utile au diagnostic.

Contraintes obligatoires :

- ne jamais logger de mot de passe, token, secret, cookie, ou payload complet
  sensible
- préférer un scope court et stable (ex : `web.auth.sign-in.submit`)
- garder les traces orientées diagnostic, pas verbeuses

---

## Workflow Git complet

### Interdiction de contournement des hooks

Le flag `--no-verify` est strictement interdit pour toutes les commandes Git
(`commit`, `push`, etc.).

Si un hook échoue, il faut corriger la cause (format, lint, typecheck, tests,
nommage) puis relancer la commande, sans contourner les contrôles.

Avant de commencer à coder, chaque collaborateur doit **s'assigner une tâche**
sur le **GitHub Project lié à ce dépôt**. Ne pas démarrer un travail sans item
de Project clairement pris en charge.

### Stratégie de fusion : rebase uniquement

Ne jamais créer de merge commits. Toujours rebaser la branche courte sur `staging`
avant de fusionner en fast-forward.

La configuration locale du dépôt impose :

```bash
git config pull.rebase true
git config merge.ff only
```

Ces réglages sont déjà appliqués dans le `.git/config` du dépôt. Si vous clonez
à nouveau, ré-exécutez les deux commandes ci-dessus.

### Séquence type

```text
1. Partir de `staging` à jour.
2. Créer une branche courte : `<type>/<sujet>`.
3. Implémenter le plus petit incrément viable.
4. Commiter en Conventional Commits.
5. Pousser la branche.
6. Ouvrir une PR vers `staging`.
7. Attendre les checks requis.
8. Merger sans merge commit, avec historique linéaire.
9. Supprimer la branche locale et distante.
10. Mettre à jour l'issue et le Project GitHub.

`main` n'est pas une branche de développement. Elle avance uniquement par PR de release depuis `staging`.
```

---

## Hooks Git (Husky)

Des vérifications automatiques s'exécutent à chaque étape :

| Moment       | Vérification                                                         | Effet si échec |
| ------------ | -------------------------------------------------------------------- | -------------- |
| `commit-msg` | Format Conventional Commits (commitlint)                             | Commit rejeté  |
| `pre-commit` | `lint-staged` (formatage/lint uniquement sur les fichiers indexés)   | Commit rejeté  |
| `pre-push`   | Nom de branche valide + contrôles ciblés selon les fichiers modifiés | Push rejeté    |

### Si un hook échoue

- **Formatage / lint pre-commit** : corriger les erreurs remontées par `lint-staged` puis recommiter
- **Lint** : corriger les erreurs signalées par ESLint
- **Typecheck** : corriger les erreurs TypeScript signalées par le contrôle ciblé (API, web, mobile, ou global)
- **Nom de branche** : renommer avec `git branch -m <nouveau-nom>`
- **Message de commit** : relancer `pnpm commit` et choisir un scope autorisé
- **Tests** : corriger les tests cassés avant de pousser (les tests E2E exhaustifs restent pilotés par la CI)

---

## Pull Requests

- Ouvrir la PR vers `staging`
- Remplir le template de PR (description, tests, captures d'écran si UI)
- Attendre la review avant de fusionner
- Fusionner exclusivement en **rebase and merge** (pas de merge commit, pas de squash)
- Après fusion, supprimer la branche locale et distante :

```bash
git switch staging
git pull --rebase origin staging
git branch -d feat/ma-feature
git push origin --delete feat/ma-feature
```

---

## Formatage du code

Le projet utilise **Prettier** pour le formatage automatique.

```bash
# Formater tous les fichiers
pnpm format

# Vérifier le formatage (sans modifier)
pnpm format:check
```

Le hook `pre-commit` s'appuie maintenant sur `lint-staged` pour n'exécuter formatage et lint que sur les fichiers indexés. Le hook `pre-push` exécute `pnpm affected:lint`, `pnpm affected:test` et `pnpm test:integration` sur les zones modifiées, puis garde `pnpm test:workspace` uniquement quand les scripts du dépôt changent, ce qui évite les E2E locales et les checks globaux inutiles.

Les hooks définissent `GIT_EXECUTABLE` avec un chemin absolu vers `git` (ou utilisent une valeur déjà fournie par l'environnement) pour verrouiller le binaire appelé. En CI, `GIT_EXECUTABLE` est fixé globalement à `/usr/bin/git`.

Pour accélérer les vérifications locales sur une branche de travail, utiliser d'abord les scripts ciblés suivants quand la portée est limitée :

- `pnpm affected:lint`
- `pnpm affected:test`
- `pnpm affected:build`

En CI, conserver le cache pnpm déjà configuré via `actions/setup-node` et, si un nouveau workflow est ajouté, garder `cache: pnpm` avec `cache-dependency-path: pnpm-lock.yaml` pour stabiliser les temps d'installation.

---

## Politique de langue

- **Code** (variables, fonctions, types, noms de fichiers) : **anglais**
- **Documentation, commentaires, textes UI, messages** : **français**

## Release

Une release suit un flux séparé :

1. Valider `staging`.
2. Ouvrir une PR `staging → main`.
3. Merger la PR de release après validation.
4. Créer un tag SemVer sur `main`.
5. Laisser le workflow de production gérer l'approbation et le déploiement.

Aucun tag de production ne doit être posé sur `staging`.
