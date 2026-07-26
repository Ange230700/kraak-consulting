---
status: active
owner: platform
last_reviewed: 2026-07-26
source_of_truth: true
---

# ARC-18 - Consolidation partielle du blog public

| Champ          | Valeur                          |
| -------------- | ------------------------------- |
| **Statut**     | Acceptée                        |
| **Date**       | 2026-07-26                      |
| **Auteurs**    | Équipe KRAAK                    |
| **Dépendance** | ARC-05, ARC-14, ARC-15          |
| **Liée à**     | issue #354, issue #630, PR #495 |

---

## 1 · Contexte

Le dépôt contient une implémentation partielle de blog public issue du chantier
CMS-03. L'issue #354 et la PR #495 avaient livré une liste `/blog`, des pages
détail `/blog/:slug`, un service public d'articles, des entrées de sitemap et
une couverture E2E.

L'état produit courant ne positionne plus ce blog comme une surface MVP active :

- ARC-14 déclare la surface vitrine publique complète sans route `/blog` ;
- ARC-15 confirme que `/ressources` est une page d'orientation statique, pas un
  blog, un média ou une bibliothèque publique d'articles ;
- les routes Angular publiques ne déclarent plus `/blog` ni `/blog/:slug` ;
- les routes de prerender et les entrées de sitemap ne publient plus d'URL de
  blog ;
- le test E2E du blog saute explicitement quand la route est indisponible ;
- le fichier `blog.data.ts` reste consommé par le tableau de bord
  d'administration.

Le risque n'est donc pas seulement du code mort. Une suppression globale du
domaine `blog` casserait aussi une dépendance encore active côté administration,
tandis qu'une restauration du blog public rouvrirait une surface éditoriale
hors MVP.

## 2 · Décision

KRAAK retient l'**option D - consolidation partielle**.

Pour le MVP :

- le blog public n'est pas restauré comme fonctionnalité active ;
- `/ressources` ne remplace pas le blog et reste une page d'orientation statique
  au sens d'ARC-15 ;
- les pages publiques de blog, le service public web et les tests E2E associés
  doivent être retirés dans une PR dédiée de nettoyage ;
- les données, types ou fixtures encore consommés par l'administration doivent
  être conservés jusqu'à leur déplacement vers un domaine neutre de contenu
  éditorial ou d'administration ;
- les contrats API, migrations Supabase et routes publiques `/articles` ne sont
  pas supprimés par cette décision, car leur périmètre dépasse le seul code
  Angular inaccessible.

Tout futur blog, média ou hub de contenu public devra repartir d'un chantier
`public-content` explicite, avec issue de backlog, critères éditoriaux,
propriété de contenu, SEO, sitemap, prerender, états de publication et décision
documentaire si la frontière MVP/V1.1 évolue.

## 3 · Justification

### 3.1 Alignement produit

Le MVP KRAAK doit rester une vitrine claire, crédible et orientée conversion.
Un blog public ajoute un produit éditorial continu : ligne éditoriale, rythme de
publication, modération, ownership, SEO de contenu et workflow de maintenance.
Cet effort ne crée pas de valeur immédiate supérieure aux parcours de contact et
d'orientation déjà gelés.

### 3.2 Cohérence d'architecture

L'absence de routes, de prerender et de sitemap montre que le blog public n'est
plus une surface web active. En revanche, l'import de `blog.data.ts` par
l'administration prouve qu'il reste une dépendance à consolider avant tout
nettoyage destructif.

### 3.3 Réversibilité

La consolidation partielle garde les décisions petites :

1. documenter la décision ;
2. déplacer ou renommer les données encore consommées ;
3. supprimer le code public inaccessible ;
4. décider séparément du devenir des endpoints et modèles d'articles.

Chaque étape peut être revue et annulée sans réactiver par accident un blog
public hors périmètre MVP.

## 4 · Implémentation attendue

Cette ADR ne modifie aucun comportement applicatif. Elle fixe la séquence de
travail suivante.

### 4.1 À conserver tant qu'un consommateur actif existe

- `apps/client/projects/web/src/app/features/blog/blog.data.ts`
- `apps/client/projects/web/src/app/features/blog/blog.data.spec.ts`
- les usages du tableau de bord d'administration jusqu'à remplacement par un
  domaine de contenu neutre ;
- les contrats `Article*` dans `packages/contracts` ;
- le module API `articles` ;
- les migrations Supabase liées aux articles.

### 4.2 À consolider dans une PR dédiée

- déplacer ou renommer `blog.data.ts` vers un emplacement neutre, par exemple
  un domaine `admin/content` ou `editorial-content` ;
- remplacer les libellés et liens d'administration qui promettent encore un
  blog public ;
- garder des noms techniques anglais et du contenu visible en français.

### 4.3 À supprimer dans une PR dédiée après consolidation

- `apps/client/projects/web/src/app/features/blog/blog.page.ts`
- `apps/client/projects/web/src/app/features/blog/blog.page.html`
- `apps/client/projects/web/src/app/features/blog/blog.page.spec.ts`
- `apps/client/projects/web/src/app/features/blog/blog-article.page.ts`
- `apps/client/projects/web/src/app/features/blog/blog-article.page.html`
- `apps/client/projects/web/src/app/features/blog/blog-article.page.spec.ts`
- `apps/client/projects/web/src/app/features/blog/blog-public.service.ts`
- `apps/client/projects/web/src/app/features/blog/blog-public.service.spec.ts`
- `apps/client/tests/e2e/blog.spec.ts`

Le fichier `apps/client/projects/web/src/app/seo/blog-sitemap-pages.json` ne doit
être supprimé qu'après retrait de ses consommateurs dans la configuration SEO et
les scripts de génération.

### 4.4 Hors périmètre de cette décision

- suppression ou désactivation des routes API `/articles` ;
- suppression des migrations Supabase d'articles ;
- suppression des contrats partagés `Article*` ;
- création d'un nouveau blog public ou d'un hub `/ressources` enrichi.

Ces sujets exigent une décision produit séparée.

## 5 · Conséquences

### 5.1 Positives

- le MVP reste aligné avec la vitrine publique gelée ;
- le dépôt évite de conserver indéfiniment des pages web inaccessibles ;
- les dépendances encore utiles à l'administration sont protégées ;
- le futur blog reste possible sans être porté par du code dormant ambigu.

### 5.2 Contraintes

- une PR de consolidation est nécessaire avant suppression complète du dossier
  `features/blog` ;
- l'administration doit perdre toute promesse visible vers `/blog` tant que la
  route publique reste absente ;
- l'API articles doit être revue séparément pour décider si elle reste un
  socle CMS futur ou si elle doit être elle aussi sortie du périmètre actif.

## 6 · Alternatives écartées

1. **Restaurer le blog public maintenant** - rejeté : l'effort dépasse un simple
   ajout de routes et impose un vrai produit éditorial.
2. **Supprimer tout le domaine blog immédiatement** - rejeté : `blog.data.ts`
   reste consommé par l'administration et certains contrats/API dépassent la
   seule surface web publique.
3. **Garer le code tel quel** - rejeté : garder des pages inaccessibles
   compilées ou testées seulement par des skips entretient une ambiguïté de
   maintenance.

## 7 · Validation attendue

Pour la PR documentaire :

- `pnpm docs:index:write`
- `pnpm docs:index:check`
- `pnpm docs:audit`

Pour les PR de consolidation suivantes :

- tests unitaires web ciblés ;
- recherche `rg` des références `/blog`, `BlogPage`, `BlogArticlePage` et
  `blogPublic` ;
- vérification sitemap/prerender ;
- E2E web uniquement si une surface utilisateur active est touchée.

## 8 · Références

- [ARC-05 - Critères anti-scope-creep](./ARC-05-criteres-anti-scope-creep.md)
- [ARC-14 - Gel de la surface vitrine publique](./ARC-14-freeze-surface-vitrine-publique.md)
- [ARC-15 - Positionnement de la page `/ressources`](./ARC-15-positionnement-page-ressources-vitrine.md)
- [Périmètre MVP](../product/MVP_SCOPE.md)
- [Issue #354 - Blog / actualités web](https://github.com/Ange230700/kraak-consulting/issues/354)
- [Issue #630 - Décision Option D](https://github.com/Ange230700/kraak-consulting/issues/630)
- [PR #495 - Implémentation initiale du blog public](https://github.com/Ange230700/kraak-consulting/pull/495)
