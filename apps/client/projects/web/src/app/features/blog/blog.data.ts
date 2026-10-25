import type { SeoPageDefinition } from '../../seo/site-seo';
import { buildLocalizedBlogArticlePath } from '../../routing/localized-public-routes';
import type { ArticleDto } from '@kraak/contracts';
import { resolveSupportedLocale, type SupportedLocale } from '@kraak/domain';

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

export function requireFrenchFallbackArticle(id: string): BlogArticle {
  const article = blogArticles.find((candidate) => candidate.id === id);

  if (!article) {
    throw new Error(`Missing French fallback Blog article "${id}".`);
  }

  return article;
}

export const englishBlogArticles: readonly BlogArticle[] = [
  {
    ...requireFrenchFallbackArticle('blog-1'),
    title: 'Clarify your project before applying',
    excerpt:
      'Before sending out applications, you need to know what you are looking for, what you bring and what you can prove.',
    content:
      '<p>A clear project helps you choose the right format, prepare useful evidence and avoid scattered efforts.</p>',
    author: {
      ...requireFrenchFallbackArticle('blog-1').author,
      role: 'KRAAK Adviser',
      bio: 'She helps young professionals turn a vague intention into a clear and actionable path.',
    },
    categoryLabel: 'Employability',
    tagLabels: ['Guidance', 'Applications', 'Leadership'],
    publishedLabel: '12 May 2026',
    summary:
      'A simple framework to clarify your goal, select your evidence and move towards a stronger application.',
    intro:
      'The first mistake is not necessarily applying badly. It is often applying without first defining the target role, the available evidence and the type of support that would actually help.',
    sections: [
      {
        heading: '1. Start with the expected outcome',
        paragraphs: [
          'Define the role, context and timeframe. A useful application responds to a specific objective and a realistic horizon.',
          'Once the objective is stable, it becomes easier to choose the experiences, training and examples worth highlighting.',
        ],
        bullets: [
          'What role or assignment are you targeting?',
          'How soon do you want to move forward?',
          'What constraints do you need to respect?',
        ],
      },
      {
        heading: '2. Separate evidence from intentions',
        paragraphs: [
          'A clear profile should distinguish what you want to do from what you can already demonstrate.',
          'This distinction helps you structure a CV, portfolio or interview with greater precision.',
        ],
      },
      {
        heading: '3. Choose a useful next step',
        paragraphs: [
          'The right next step is not always another application. It may be a guidance session, a CV update or a targeted programme.',
        ],
      },
    ],
    takeawayPoints: [
      'A clear objective simplifies every other decision.',
      'Evidence should be selected before it is polished.',
      'The next step should remain actionable and time-bound.',
    ],
  },
  {
    ...requireFrenchFallbackArticle('blog-2'),
    title: 'Choose a useful training format',
    excerpt:
      'Training is useful only when it responds to a specific situation, a clear constraint and measurable progress.',
    content:
      '<p>The best format is not necessarily the longest. It is the one that helps you move forward methodically.</p>',
    author: {
      ...requireFrenchFallbackArticle('blog-2').author,
      role: 'Programme Manager',
      bio: 'He designs short, structured formats that help participants progress without getting lost in theory.',
    },
    categoryLabel: 'Training',
    tagLabels: ['Training', 'Skills', 'Progress'],
    publishedLabel: '20 May 2026',
    summary:
      'Three simple criteria for choosing a training format that fits your objective, level and schedule.',
    intro:
      'The right training format is not a catalogue. It is a calibrated response to a specific situation.',
    sections: [
      {
        heading: '1. Check the actual need',
        paragraphs: [
          'Before choosing a format, clarify the problem to solve. Is it a lack of method, a need for practice or a need to develop your professional posture?',
        ],
      },
      {
        heading: '2. Choose the right level of intensity',
        paragraphs: [
          'An intensive workshop can unblock a specific issue. A longer programme can help establish lasting habits.',
        ],
      },
      {
        heading: '3. Decide how progress will be measured',
        paragraphs: [
          'If you cannot observe a difference after the chosen format, the objective or the format probably needs to be adjusted.',
        ],
      },
    ],
    takeawayPoints: [
      'The need always comes before the format.',
      'The level of intensity should match the urgency.',
      'Progress should be observable.',
    ],
  },
  {
    ...requireFrenchFallbackArticle('blog-3'),
    title:
      'Prepare an immigration application without losing sight of the big picture',
    excerpt:
      'An application becomes weaker when its documents stop telling the same story. The priority is to maintain overall consistency.',
    content:
      '<p>The quality of an application does not depend on documents alone. It also depends on consistency between the narrative, the evidence and the timeline.</p>',
    author: {
      ...requireFrenchFallbackArticle('blog-3').author,
      role: 'Mobility Adviser',
      bio: 'She supports international profiles in the structured preparation of study and work mobility projects.',
    },
    categoryLabel: 'Immigration',
    tagLabels: ['Immigration', 'Application', 'Preparation'],
    publishedLabel: '24 May 2026',
    summary:
      'A short method for keeping your intention, supporting documents and timeline consistent.',
    intro:
      'The strongest application is not necessarily the longest. It is the one that remains consistent from beginning to end.',
    sections: [
      {
        heading: '1. Build a clear thread',
        paragraphs: [
          'Before completing a form, describe the project you are presenting in one sentence. Use that sentence as a reference point for every supporting document.',
        ],
      },
      {
        heading: '2. Organise the evidence in the right order',
        paragraphs: [
          'A clear application aligns its evidence with the logic of the project: identity, education, experience, resources and timeline.',
        ],
      },
      {
        heading: '3. Keep a safety margin',
        paragraphs: [
          'Deadlines, translations and additional administrative requests require margin. Avoid working right up against the deadline.',
        ],
      },
    ],
    takeawayPoints: [
      'A clear project makes supporting documents easier to organise.',
      'The order of the evidence matters as much as its presence.',
      'A safety margin reduces avoidable errors.',
    ],
  },
];

const BLOG_ARTICLES_BY_LOCALE = {
  'fr-CI': blogArticles,
  'en-GB': englishBlogArticles,
} satisfies Record<SupportedLocale, readonly BlogArticle[]>;

const FALLBACK_AUTHORS = {
  'fr-CI': {
    name: 'Équipe KRAAK',
    role: 'Rédaction KRAAK',
    bio: 'Contenu éditorial KRAAK orienté vers des décisions concrètes et actionnables.',
    avatar: '/assets/site-visuals/photos/home-services-training.avif',
  },
  'en-GB': {
    name: 'KRAAK Team',
    role: 'KRAAK Editorial Team',
    bio: 'KRAAK editorial content focused on concrete, actionable decisions.',
    avatar: '/assets/site-visuals/photos/home-services-training.avif',
  },
} satisfies Record<SupportedLocale, BlogAuthor>;

const FALLBACK_COVER_IMAGE_PATH =
  '/assets/site-visuals/photos/home-hero-workshop.avif';

const BLOG_FALLBACK_COPY_BY_LOCALE = {
  'fr-CI': {
    categoryLabel: 'Actualités',
    categorySlug: 'actualites',
    publicationUpcoming: 'Publication à venir',
    publicationRecent: 'Publication récente',
    defaultIntro: 'Cet article est disponible dans le blog KRAAK.',
    contentHeading: 'Contenu',
    pendingContent: 'Le contenu de cet article sera bientôt enrichi.',
    articleImageAltPrefix: "Illustration de l'article",
    missingSeoTitle: 'Article introuvable | KRAAK Consulting',
    missingSeoDescription:
      'L’article demandé n’est pas disponible. Retournez au blog KRAAK pour poursuivre votre lecture.',
    missingSeoImageAlt:
      "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
  },
  'en-GB': {
    categoryLabel: 'News',
    categorySlug: 'news',
    publicationUpcoming: 'Coming soon',
    publicationRecent: 'Recent publication',
    defaultIntro: 'This article is available on the KRAAK blog.',
    contentHeading: 'Content',
    pendingContent: 'This article will be expanded soon.',
    articleImageAltPrefix: 'Article illustration:',
    missingSeoTitle: 'Article not found | KRAAK Consulting',
    missingSeoDescription:
      'The requested article is not available. Return to the KRAAK blog to continue reading.',
    missingSeoImageAlt:
      'Photo of a KRAAK Consulting workshop with participants in a work session.',
  },
} as const;

const BLOG_DATE_FORMATTERS = {
  'fr-CI': new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  'en-GB': new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
} satisfies Record<SupportedLocale, Intl.DateTimeFormat>;

function isWhitespaceCharacter(char: string): boolean {
  return (
    char === ' ' ||
    char === '\n' ||
    char === '\r' ||
    char === '\t' ||
    char === '\f' ||
    char === '\v'
  );
}

function collapseWhitespace(value: string): string {
  let result = '';
  let previousWasWhitespace = false;

  for (const char of value) {
    if (isWhitespaceCharacter(char)) {
      if (!previousWasWhitespace) {
        result += ' ';
      }

      previousWasWhitespace = true;
      continue;
    }

    previousWasWhitespace = false;
    result += char;
  }

  return result.trim();
}

function stripHtmlTags(value: string): string {
  let textWithoutTags = '';
  let insideTag = false;

  for (const char of value) {
    if (char === '<') {
      insideTag = true;
      textWithoutTags += ' ';
      continue;
    }

    if (char === '>') {
      insideTag = false;
      continue;
    }

    if (!insideTag) {
      textWithoutTags += char;
    }
  }

  return collapseWhitespace(textWithoutTags);
}

function estimateReadingTimeMinutes(content: string): number {
  const plainText = stripHtmlTags(content);
  let words = 0;
  let insideWord = false;

  for (const char of plainText) {
    if (isWhitespaceCharacter(char)) {
      insideWord = false;
      continue;
    }

    if (!insideWord) {
      words += 1;
      insideWord = true;
    }
  }

  return Math.max(1, Math.ceil(words / 200));
}

function formatPublishedLabel(
  publishedAt: string | null,
  locale: SupportedLocale,
): string {
  const copy = BLOG_FALLBACK_COPY_BY_LOCALE[locale];

  if (!publishedAt) {
    return copy.publicationUpcoming;
  }

  const parsedDate = new Date(publishedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return copy.publicationRecent;
  }

  return BLOG_DATE_FORMATTERS[locale].format(parsedDate);
}

function buildIntroFromContent(
  content: string,
  locale: SupportedLocale,
  fallback?: string,
): string {
  if (fallback && fallback.trim().length > 0) {
    return fallback;
  }

  const plainText = stripHtmlTags(content);

  if (plainText.length === 0) {
    return BLOG_FALLBACK_COPY_BY_LOCALE[locale].defaultIntro;
  }

  return plainText.slice(0, 240);
}

function buildSectionsFromContent(
  content: string,
  locale: SupportedLocale,
  fallback?: readonly BlogSection[],
): readonly BlogSection[] {
  if (fallback && fallback.length > 0) {
    return fallback;
  }

  const plainText = stripHtmlTags(content);
  const copy = BLOG_FALLBACK_COPY_BY_LOCALE[locale];

  if (plainText.length === 0) {
    return [
      {
        heading: copy.contentHeading,
        paragraphs: [copy.pendingContent],
      },
    ];
  }

  return [
    {
      heading: copy.contentHeading,
      paragraphs: [plainText],
    },
  ];
}

export function getFallbackBlogArticles(
  localeCandidate?: SupportedLocale | string | null,
): readonly BlogArticle[] {
  const locale = resolveSupportedLocale(localeCandidate);

  return BLOG_ARTICLES_BY_LOCALE[locale];
}

export function mapPublicArticleToBlogArticle(
  article: ArticleDto,
  localeCandidate?: SupportedLocale | string | null,
): BlogArticle {
  const locale = resolveSupportedLocale(localeCandidate);
  const fallbackArticles = BLOG_ARTICLES_BY_LOCALE[locale];
  const fallback =
    fallbackArticles.find((candidate) => candidate.slug === article.slug) ??
    fallbackArticles.find((candidate) => candidate.id === article.id);
  const copy = BLOG_FALLBACK_COPY_BY_LOCALE[locale];

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    status: article.status,
    coverImageUrl: article.coverImageUrl,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    publishedAt: article.publishedAt,
    authorId: article.authorId,
    categoryIds: article.categoryIds,
    tagIds: article.tagIds,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: fallback?.author ?? FALLBACK_AUTHORS[locale],
    categoryLabel: fallback?.categoryLabel ?? copy.categoryLabel,
    categorySlug: fallback?.categorySlug ?? copy.categorySlug,
    tagLabels: fallback?.tagLabels ?? [],
    coverImagePath: fallback?.coverImagePath ?? FALLBACK_COVER_IMAGE_PATH,
    readingTimeMinutes:
      fallback?.readingTimeMinutes ??
      estimateReadingTimeMinutes(article.content),
    publishedLabel: formatPublishedLabel(article.publishedAt, locale),
    summary: article.excerpt,
    intro: buildIntroFromContent(article.content, locale, fallback?.intro),
    sections: buildSectionsFromContent(
      article.content,
      locale,
      fallback?.sections,
    ),
    takeawayPoints: fallback?.takeawayPoints ?? [],
    relatedSlugs: fallback?.relatedSlugs ?? [],
    featured: fallback?.featured ?? false,
  };
}

export function mapPublicArticlesToBlogArticles(
  articles: readonly ArticleDto[],
  localeCandidate?: SupportedLocale | string | null,
): BlogArticle[] {
  return articles
    .map((article) => mapPublicArticleToBlogArticle(article, localeCandidate))
    .sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;

      return rightTime - leftTime;
    });
}

export function buildBlogArticleSeo(
  article: BlogArticle,
  localeCandidate?: SupportedLocale | string | null,
): SeoPageDefinition {
  const locale = resolveSupportedLocale(localeCandidate);
  const copy = BLOG_FALLBACK_COPY_BY_LOCALE[locale];
  const path = buildLocalizedBlogArticlePath(article.slug, locale);

  return {
    path,
    canonicalPath: path,
    title: `${article.title} | KRAAK Consulting`,
    description: article.seoDescription ?? article.summary,
    openGraph: {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.summary,
      imagePath: article.coverImagePath,
      imageAlt: `${copy.articleImageAltPrefix} ${article.title}`,
    },
    sitemap: {
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  };
}

export function buildMissingBlogArticleSeo(
  slug: string,
  localeCandidate?: SupportedLocale | string | null,
): SeoPageDefinition {
  const locale = resolveSupportedLocale(localeCandidate);
  const copy = BLOG_FALLBACK_COPY_BY_LOCALE[locale];
  const path = buildLocalizedBlogArticlePath(slug, locale);

  return {
    path,
    canonicalPath: path,
    title: copy.missingSeoTitle,
    description: copy.missingSeoDescription,
    openGraph: {
      title: copy.missingSeoTitle,
      description: copy.missingSeoDescription,
      imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
      imageAlt: copy.missingSeoImageAlt,
    },
    sitemap: {
      changeFrequency: 'never',
      priority: 0.1,
    },
  };
}

export function findBlogArticleBySlug(
  slug: string,
  source: readonly BlogArticle[] = blogArticles,
): BlogArticle | undefined {
  return source.find((article) => article.slug === slug);
}

export function getRelatedBlogArticles(
  article: BlogArticle,
  source: readonly BlogArticle[] = blogArticles,
  limit = 3,
): BlogArticle[] {
  return source
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
