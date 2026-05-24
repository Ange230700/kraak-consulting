import type { SeoPageDefinition } from '../../seo/site-seo';

export interface BlogSection {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export interface BlogAuthor {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  coverImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  authorId: string;
  categoryIds: readonly string[];
  tagIds: readonly string[];
  createdAt?: string;
  updatedAt?: string;
  readonly author: BlogAuthor;
  readonly categoryLabel: string;
  readonly categorySlug: string;
  readonly tagLabels: readonly string[];
  readonly coverImagePath: string;
  readonly readingTimeMinutes: number;
  readonly publishedLabel: string;
  readonly summary: string;
  readonly intro: string;
  readonly sections: readonly BlogSection[];
  readonly takeawayPoints: readonly string[];
  readonly relatedSlugs: readonly string[];
  readonly featured: boolean;
}

const articleBase = {
  status: 'published' as const,
  publishedAt: '2026-05-24T09:00:00.000Z',
  coverImageUrl: null,
  seoTitle: null,
  seoDescription: null,
};

export const blogArticles: readonly BlogArticle[] = [
  {
    ...articleBase,
    id: 'blog-1',
    slug: 'clarifier-son-projet-avant-de-candidater',
    title: 'Clarifier son projet avant de candidater',
    excerpt:
      'Avant de multiplier les candidatures, il faut savoir ce que vous cherchez, ce que vous apportez et ce que vous pouvez prouver.',
    content:
      '<p>Un projet clair aide à choisir le bon format, à préparer des preuves utiles et à éviter les démarches dispersées.</p>',
    authorId: 'author-aline',
    categoryIds: ['category-employabilite'],
    tagIds: ['tag-orientation', 'tag-candidature', 'tag-leadership'],
    author: {
      name: 'Aline Koné',
      role: 'Conseillère KRAAK',
      bio: 'Elle accompagne les jeunes professionnels à transformer une intention floue en trajectoire actionnable.',
      avatar: '/assets/site-visuals/photos/home-services-training.avif',
    },
    categoryLabel: 'Employabilité',
    categorySlug: 'employabilite',
    tagLabels: ['Orientation', 'Candidature', 'Leadership'],
    coverImagePath:
      '/assets/site-visuals/photos/home-services-project-planning.avif',
    readingTimeMinutes: 4,
    publishedLabel: '12 mai 2026',
    summary:
      'Un cadre simple pour clarifier votre objectif, choisir vos preuves et avancer vers une candidature plus crédible.',
    intro:
      'La première erreur n’est pas de mal candidater. C’est souvent de candidater sans avoir défini le rôle visé, les preuves disponibles et le format d’appui utile.',
    sections: [
      {
        heading: '1. Commencez par le résultat attendu',
        paragraphs: [
          'Définissez le rôle, le contexte et le délai. Une candidature utile répond à un objectif précis et à un horizon réaliste.',
          'Quand l’objectif est stable, il devient plus simple de choisir les expériences, les formations et les exemples à mettre en avant.',
        ],
        bullets: [
          'Quel poste ou quelle mission visez-vous ?',
          'Dans quel délai voulez-vous avancer ?',
          'Quelles contraintes devez-vous respecter ?',
        ],
      },
      {
        heading: '2. Séparez les preuves des intentions',
        paragraphs: [
          'Une fiche claire doit distinguer ce que vous souhaitez faire de ce que vous pouvez déjà démontrer.',
          'Cette distinction permet de structurer un CV, un portfolio ou un entretien avec plus de précision.',
        ],
      },
      {
        heading: '3. Choisissez un prochain pas utile',
        paragraphs: [
          'Le bon prochain pas n’est pas toujours un nouveau dossier. Il peut s’agir d’une séance d’orientation, d’une mise à jour de CV ou d’un programme ciblé.',
        ],
      },
    ],
    takeawayPoints: [
      'Un objectif clair simplifie toutes les autres décisions.',
      'Les preuves doivent être sélectionnées avant d’être embellies.',
      'La prochaine étape doit rester actionnable et datée.',
    ],
    relatedSlugs: [
      'choisir-un-format-de-formation-utile',
      'preparer-un-dossier-immigration-sans-perdre-le-fil',
    ],
    featured: true,
  },
  {
    ...articleBase,
    id: 'blog-2',
    slug: 'choisir-un-format-de-formation-utile',
    title: 'Choisir un format de formation utile',
    excerpt:
      'Une formation n’est utile que si elle répond à une situation précise, à une contrainte claire et à une progression mesurable.',
    content:
      '<p>Le meilleur format n’est pas forcément le plus long. C’est celui qui vous aide à bouger avec méthode.</p>',
    authorId: 'author-joel',
    categoryIds: ['category-formation'],
    tagIds: ['tag-formation', 'tag-competences', 'tag-progress'],
    author: {
      name: 'Joël Nguessan',
      role: 'Chef de programme',
      bio: 'Il conçoit des formats courts et structurés pour faire progresser les participants sans les perdre dans la théorie.',
      avatar: '/assets/site-visuals/photos/home-services-training.avif',
    },
    categoryLabel: 'Formation',
    categorySlug: 'formation',
    tagLabels: ['Formation', 'Compétences', 'Progression'],
    coverImagePath: '/assets/site-visuals/photos/home-services-training.avif',
    readingTimeMinutes: 3,
    publishedLabel: '20 mai 2026',
    summary:
      'Trois critères simples pour choisir un format de formation qui respecte votre objectif, votre niveau et votre calendrier.',
    intro:
      'Le bon format de formation n’est pas un catalogue. C’est une réponse calibrée à une situation précise.',
    sections: [
      {
        heading: '1. Vérifiez le besoin réel',
        paragraphs: [
          'Avant de choisir, clarifiez le problème à résoudre. S’agit-il d’un manque de méthode, d’un besoin de pratique ou d’une montée en posture ?',
        ],
      },
      {
        heading: '2. Choisissez le niveau de densité',
        paragraphs: [
          'Un atelier intensif aide à débloquer un point précis. Un parcours plus long aide à installer des habitudes durables.',
        ],
      },
      {
        heading: '3. Préparez la mesure du progrès',
        paragraphs: [
          'Si l’on ne peut pas observer une différence après le format choisi, il faut probablement ajuster l’objectif ou le format.',
        ],
      },
    ],
    takeawayPoints: [
      'Le besoin précède toujours le format.',
      'La densité doit correspondre au niveau d’urgence.',
      'Le progrès doit être observable.',
    ],
    relatedSlugs: [
      'clarifier-son-projet-avant-de-candidater',
      'preparer-un-dossier-immigration-sans-perdre-le-fil',
    ],
    featured: false,
  },
  {
    ...articleBase,
    id: 'blog-3',
    slug: 'preparer-un-dossier-immigration-sans-perdre-le-fil',
    title: 'Préparer un dossier immigration sans perdre le fil',
    excerpt:
      'Un dossier se fragilise quand les pièces ne racontent plus la même histoire. L’enjeu est de garder une cohérence d’ensemble.',
    content:
      '<p>La qualité d’un dossier ne se joue pas seulement sur les documents. Elle dépend aussi de la cohérence entre le récit, les preuves et le calendrier.</p>',
    authorId: 'author-marie',
    categoryIds: ['category-immigration'],
    tagIds: ['tag-immigration', 'tag-dossier', 'tag-preparation'],
    author: {
      name: 'Marie Ahoua',
      role: 'Conseillère mobilité',
      bio: 'Elle accompagne les profils internationaux dans la préparation structurée de leurs projets d’études et de travail.',
      avatar: '/assets/site-visuals/photos/services-immigration.avif',
    },
    categoryLabel: 'Immigration',
    categorySlug: 'immigration',
    tagLabels: ['Immigration', 'Dossier', 'Préparation'],
    coverImagePath: '/assets/site-visuals/photos/services-immigration.avif',
    readingTimeMinutes: 5,
    publishedLabel: '24 mai 2026',
    summary:
      'Une méthode courte pour garder la cohérence entre votre intention, vos pièces justificatives et votre calendrier.',
    intro:
      'Le dossier le plus solide n’est pas forcément le plus long. C’est celui qui reste cohérent du début à la fin.',
    sections: [
      {
        heading: '1. Construisez un fil conducteur',
        paragraphs: [
          'Avant de remplir un formulaire, rédigez en une phrase le projet que vous défendez. Cette phrase servira de repère pour toutes les pièces.',
        ],
      },
      {
        heading: '2. Rassemblez les preuves dans le bon ordre',
        paragraphs: [
          'Un dossier clair aligne les preuves sur la logique du projet: identité, formation, expérience, ressources, calendrier.',
        ],
      },
      {
        heading: '3. Gardez une marge de sécurité',
        paragraphs: [
          'Les délais, les traductions et les compléments administratifs demandent de la marge. Ne travaillez pas au bord de l’échéance.',
        ],
      },
    ],
    takeawayPoints: [
      'Un projet clair simplifie le tri des pièces.',
      'L’ordre des preuves compte autant que leur présence.',
      'La marge de sécurité réduit les erreurs évitables.',
    ],
    relatedSlugs: [
      'clarifier-son-projet-avant-de-candidater',
      'choisir-un-format-de-formation-utile',
    ],
    featured: false,
  },
] as const;

export const blogListSeo: SeoPageDefinition = {
  path: 'blog',
  title: 'Blog | Actualités et analyses KRAAK Consulting',
  description:
    'Découvrez les articles KRAAK sur l’employabilité, la formation, la gestion de projet et la mobilité internationale.',
  openGraph: {
    title: 'Blog KRAAK Consulting',
    description:
      'Un espace éditorial public pour clarifier un projet, préparer une candidature et mieux choisir son prochain pas.',
    imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
    imageAlt:
      "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
  },
  sitemap: {
    changeFrequency: 'weekly',
    priority: 0.75,
  },
};

export function buildBlogArticleSeo(article: BlogArticle): SeoPageDefinition {
  return {
    path: `blog/${article.slug}`,
    title: `${article.title} | KRAAK Consulting`,
    description: article.seoDescription ?? article.summary,
    openGraph: {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.summary,
      imagePath: article.coverImagePath,
      imageAlt: `Illustration de l'article ${article.title}`,
    },
    sitemap: {
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  };
}

export function buildMissingBlogArticleSeo(slug: string): SeoPageDefinition {
  return {
    path: `blog/${slug}`,
    title: 'Article introuvable | KRAAK Consulting',
    description:
      'L’article demandé n’est pas disponible. Retournez au blog KRAAK pour poursuivre votre lecture.',
    openGraph: {
      title: 'Article introuvable | KRAAK Consulting',
      description:
        'L’article demandé n’est pas disponible. Retournez au blog KRAAK pour poursuivre votre lecture.',
      imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
      imageAlt:
        "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
    },
    sitemap: {
      changeFrequency: 'never',
      priority: 0.1,
    },
  };
}

export function findBlogArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}

export function getRelatedBlogArticles(
  article: BlogArticle,
  limit = 3,
): BlogArticle[] {
  return blogArticles
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => ({
      candidate,
      score:
        (candidate.categorySlug === article.categorySlug ? 2 : 0) +
        candidate.tagLabels.filter((tag) => article.tagLabels.includes(tag))
          .length,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
