# Wireframe — Contact `/contact`

**Objectif :** proposer un canal de prise de contact simple et rassurant,
orienter selon le besoin (formation, projet, immigration, autre).  
**Route Angular :** `ContactComponent` →
`apps/client/projects/web/src/app/features/contact/`

---

## Sections

---

### 1. HEADER (composant partagé)

Voir [README.md](README.md#header--présent-sur-toutes-les-pages).

---

### 2. PAGE HERO — bannière interne

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   < Fond : dégradé navy → blue >                            ║
║                                                              ║
║   Parlons de votre projet                                    ║
║                                                              ║
║   KRAAK — Accueil > Contact                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

- Fond : navy → blue ou image overlay
- Titre : Poppins 700, blanc, 40 px / 28 px mobile
- Fil d'Ariane : blanc 70 %, 13 px
- Hauteur : 280 px desktop, 200 px mobile

---

### 3. CONTENU PRINCIPAL — 2 colonnes desktop

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ┌─────────────────────────────┐  ┌──────────────────────┐  ║
║  │  FORMULAIRE (col gauche)    │  │  COORDONNÉES (col    │  ║
║  │                             │  │  droite)             │  ║
║  │  Nom *                      │  │                      │  ║
║  │  ┌─────────────────────┐    │  │  < Icône email >     │  ║
║  │  │                     │    │  │  contact@kraak.com   │  ║
║  │  └─────────────────────┘    │  │                      │  ║
║  │                             │  │  < Icône tel >       │  ║
║  │  Prénom *                   │  │  +XX XX XX XX XX     │  ║
║  │  ┌─────────────────────┐    │  │                      │  ║
║  │  │                     │    │  │  < Icône WhatsApp >  │  ║
║  │  └─────────────────────┘    │  │  WhatsApp disponible │  ║
║  │                             │  │                      │  ║
║  │  Adresse e-mail *           │  │  ─────────────────── │  ║
║  │  ┌─────────────────────┐    │  │                      │  ║
║  │  │                     │    │  │  Réseaux sociaux     │  ║
║  │  └─────────────────────┘    │  │  [LinkedIn]          │  ║
║  │                             │  │  [Facebook]          │  ║
║  │  Numéro de téléphone        │  │  [Instagram]         │  ║
║  │  ┌─────────────────────┐    │  │                      │  ║
║  │  │ +XX                 │    │  │  ─────────────────── │  ║
║  │  └─────────────────────┘    │  │                      │  ║
║  │                             │  │  Zone de service     │  ║
║  │  Objet de la demande *      │  │  Afrique de l'Ouest, │  ║
║  │  ┌─────────────────────┐    │  │  Europe,             │  ║
║  │  │ ▼ Choisir           │    │  │  Amérique du Nord    │  ║
║  │  └─────────────────────┘    │  │                      │  ║
║  │    Formation                │  │                      │  ║
║  │    Gestion de projet        │  │                      │  ║
║  │    Immigration              │  │                      │  ║
║  │    Autre                    │  │                      │  ║
║  │                             │  │                      │  ║
║  │  Message *                  │  │                      │  ║
║  │  ┌─────────────────────┐    │  │                      │  ║
║  │  │                     │    │  │                      │  ║
║  │  │  (5 lignes)         │    │  │                      │  ║
║  │  └─────────────────────┘    │  │                      │  ║
║  │                             │  │                      │  ║
║  │  [Envoyer la demande]       │  │                      │  ║
║  │                             │  │                      │  ║
║  └─────────────────────────────┘  └──────────────────────┘  ║
╚══════════════════════════════════════════════════════════════╝
```

#### Colonne gauche — Formulaire de contact

| Champ               | Type     | Requis | Validation                                          |
| ------------------- | -------- | ------ | --------------------------------------------------- |
| Nom                 | texte    | ✓      | min 2 car., max 64 car.                             |
| Prénom              | texte    | ✓      | min 2 car., max 64 car.                             |
| Adresse e-mail      | email    | ✓      | format email valide                                 |
| Numéro de téléphone | tel      | —      | format international optionnel                      |
| Objet de la demande | select   | ✓      | Formation / Gestion de projet / Immigration / Autre |
| Message             | textarea | ✓      | min 20 car., max 1 000 car.                         |

- Fond : blanc
- Labels : Poppins 500, navy, 14 px
- Inputs : fond blanc, border 1 px `#d1d5db`, border-radius 6 px, focus ring
  cyan `#4cc3d9`
- Champs requis : marqueur `*` rouge
- Bouton submit : fond blue `#1673ae`, blanc, Poppins 600, 16 px, pleine
  largeur, hover navy
- Validation : inline sous le champ (rouge `#ef4444`, Poppins 400, 13 px)
- RGPD : lien "Politique de confidentialité" sous le bouton, taille 12 px

#### Colonne droite — Coordonnées

- Fond : page `#f3f3f3`, border-radius 8 px, padding 24 px
- Icônes : navy `#122b4a`, 20 px
- Texte : Poppins 400, gris foncé, 14 px
- Email / téléphone : liens cliquables (`mailto:`, `tel:`)
- Réseaux : icônes sociales navy, 24 px, hover blue
- Zone de service : texte simple, Poppins 400, 14 px

---

### 4. MESSAGE DE CONFIRMATION (état post-envoi)

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  < Icône check cyan >                            │
  │                                                  │
  │  Votre demande a bien été envoyée !              │
  │                                                  │
  │  Nous vous répondrons dans les 48 heures.        │
  │                                                  │
  │  [Retour à l'accueil]                            │
  │                                                  │
  └──────────────────────────────────────────────────┘
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- Remplace le formulaire après envoi réussi (état local Angular)
- Icône : check circle cyan `#4cc3d9`, 64 px
- Titre : Poppins 700, navy, 24 px, centré
- Sous-titre : Poppins 400, gris foncé, 16 px
- Bouton : fond blue, blanc, retour vers `/`

---

### 5. FOOTER (composant partagé)

Voir [README.md](README.md#footer--présent-sur-toutes-les-pages).

---

## Points d'attention implémentation

| Point         | Détail                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Accessibilité | `<label>` associé à chaque champ (`for` / `id`), messages d'erreur liés via `aria-describedby` |
| SEO           | `<title>` "Contactez-nous — KRAAK", noindex optionnel si page non prioritaire                  |
| Responsive    | 2 colonnes → 1 colonne (formulaire d'abord, coordonnées ensous) sous 768 px                    |
| Validation    | Côté client : Angular Reactive Forms + validateurs natifs. Côté serveur : DTO NestJS           |
| Anti-spam     | Honeypot invisible ou reCAPTCHA v3 invisible (configurable)                                    |
| Envoi e-mail  | Backend NestJS (`ContactService`) → Resend API ; voir `ARC-04`                                 |
| Pre-fill      | Query param `?sujet=inscription` pré-sélectionne l'option dans le select                       |
| RGPD          | Lien vers politique de confidentialité obligatoire sous le bouton submit                       |
