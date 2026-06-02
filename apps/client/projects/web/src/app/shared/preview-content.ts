import { buildAvatarCircleUrl } from './brand/brand-constants';

export interface ImpactStat {
  title: string;
  label: string;
}

export interface ImpactStatsPreviewSection {
  eyebrow: string;
  title: string;
}

export const IMPACT_STATS_PREVIEW_SECTION: ImpactStatsPreviewSection = {
  eyebrow: 'Aperçu indicatif',
  title: 'Chiffres d’impact en prévisualisation',
};

export const IMPACT_STATS_PREVIEW: ImpactStat[] = [
  {
    title: '1M+',
    label: 'Compétences activées vers des opportunités concrètes',
  },
  {
    title: '72K+',
    label: 'Parcours structurés lancés avec accompagnement ciblé',
  },
  {
    title: '2.5M+',
    label: 'Participants orientés vers emploi, projet ou mobilité',
  },
];

export interface TeamMemberPreview {
  id: number;
  name: string;
  role: string;
  image: string;
}

export interface TeamGridPreviewSection {
  badge: string;
  title: string;
  description: string;
}

export const TEAM_GRID_PREVIEW_SECTION: TeamGridPreviewSection = {
  badge: "Prévisualisation de l'équipe KRAAK",
  title: "L'équipe KRAAK",
  description:
    "En attendant la liste officielle, voici un aperçu du format de présentation des membres de l'équipe.",
};

export const TEAM_GRID_PREVIEW_MEMBERS: TeamMemberPreview[] = [
  {
    id: 1,
    name: 'Savannah Nguyen',
    role: 'Développeuse logiciel',
    image: buildAvatarCircleUrl('avatar-f-1.png'),
  },
  {
    id: 2,
    name: 'Jenny Wilson',
    role: 'Développeuse logiciel',
    image: buildAvatarCircleUrl('avatar-f-2.png'),
  },
  {
    id: 3,
    name: 'Albert Flores',
    role: 'Testeur logiciel',
    image: buildAvatarCircleUrl('avatar-m-1.png'),
  },
  {
    id: 4,
    name: 'Ralph Edwards',
    role: "Chef d'équipe",
    image: buildAvatarCircleUrl('avatar-m-2.png'),
  },
  {
    id: 5,
    name: 'Eleanor Pena',
    role: 'Spécialiste marketing',
    image: buildAvatarCircleUrl('avatar-f-3.png'),
  },
  {
    id: 6,
    name: 'Annette Black',
    role: 'Designer UI/UX',
    image: buildAvatarCircleUrl('avatar-f-4.png'),
  },
  {
    id: 7,
    name: 'Arlene McCoy',
    role: 'Développeuse logiciel',
    image: buildAvatarCircleUrl('avatar-f-5.png'),
  },
  {
    id: 8,
    name: 'James Wilson',
    role: 'Product manager',
    image: buildAvatarCircleUrl('avatar-m-3.png'),
  },
  {
    id: 9,
    name: 'Darlene Robertson',
    role: 'Testeuse logiciel',
    image: buildAvatarCircleUrl('avatar-f-6.png'),
  },
  {
    id: 10,
    name: 'Kristin Watson',
    role: 'Développeuse logiciel',
    image: buildAvatarCircleUrl('avatar-f-7.png'),
  },
  {
    id: 11,
    name: 'Floyd Miles',
    role: 'Testeur logiciel',
    image: buildAvatarCircleUrl('avatar-m-4.png'),
  },
  {
    id: 12,
    name: 'Jane Olivia',
    role: 'Designer UI/UX',
    image: buildAvatarCircleUrl('avatar-f-8.png'),
  },
];

export interface TestimonialPreview {
  id: number;
  name: string;
  job: string;
  avatar: string;
  comment: string;
}

export interface TestimonialsPreviewSection {
  badge: string;
}

export const TESTIMONIALS_PREVIEW_SECTION: TestimonialsPreviewSection = {
  badge: 'Prévisualisation du format témoignages',
};

export const TESTIMONIALS_PREVIEW: TestimonialPreview[] = [
  {
    id: 1,
    name: 'Aïcha K.',
    job: 'Jeune professionnelle',
    avatar: buildAvatarCircleUrl('avatar-m-16.png'),
    comment:
      "Grâce à KRAAK, j'ai clarifié mon objectif de mobilité et identifié les étapes concrètes pour renforcer mon profil avant de lancer mes démarches.",
  },
  {
    id: 2,
    name: 'Moussa T.',
    job: 'Entrepreneur',
    avatar: buildAvatarCircleUrl('avatar-f-18.png'),
    comment:
      "L'accompagnement projet nous a permis de transformer une idée floue en feuille de route structurée, avec des priorités lisibles et des actions réalistes.",
  },
  {
    id: 3,
    name: 'Clarisse N.',
    job: 'Responsable RH',
    avatar: buildAvatarCircleUrl('avatar-m-1.png'),
    comment:
      'Le format entreprise est sobre, utile et orienté terrain. Il aide vraiment à travailler la cohésion, le leadership et la montée en compétences.',
  },
];
