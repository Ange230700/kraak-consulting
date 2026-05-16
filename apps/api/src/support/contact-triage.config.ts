import type { ContactFormDto } from '@kraak/contracts';

export interface ContactTriagePlan {
  category: ContactFormDto['category'];
  label: string;
  internalPath: string;
  responseWorkflow: string;
  fallbackWorkflow: string;
}

export const CONTACT_TRIAGE_PLANS: Record<
  ContactFormDto['category'],
  ContactTriagePlan
> = {
  technical: {
    category: 'technical',
    label: 'Support technique',
    internalPath: 'ops-digital/support-technique',
    responseWorkflow:
      'Qualifier le blocage, vérifier le canal concerné, répondre sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, conserver le ticket authentifié ou réorienter vers le contact direct public.',
  },
  training: {
    category: 'training',
    label: 'Formation',
    internalPath: 'formation/orientation-public',
    responseWorkflow:
      'Qualifier le public, le besoin de montée en compétence et proposer un échange d’orientation sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, inviter la personne à écrire directement par e-mail ou WhatsApp depuis la page contact.',
  },
  program: {
    category: 'program',
    label: 'Programme',
    internalPath: 'programmes/catalogue-et-admission',
    responseWorkflow:
      'Identifier le programme visé, l’éligibilité et la prochaine session ou orientation disponible sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, conserver le ticket authentifié ou basculer vers le contact direct public.',
  },
  session: {
    category: 'session',
    label: 'Session',
    internalPath: 'programmes/sessions-et-cohortes',
    responseWorkflow:
      'Vérifier la session, le calendrier ou la cohorte concernée, puis répondre sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, conserver le ticket authentifié ou réorienter vers le contact direct public.',
  },
  billing: {
    category: 'billing',
    label: 'Facturation',
    internalPath: 'administration/facturation',
    responseWorkflow:
      'Qualifier la demande administrative ou financière et répondre sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, conserver le ticket authentifié ou demander un contact direct sans données sensibles.',
  },
  project_management: {
    category: 'project_management',
    label: 'Gestion de projets',
    internalPath: 'conseil/gestion-de-projets',
    responseWorkflow:
      'Qualifier le contexte projet, les parties prenantes, l’urgence et proposer un cadrage sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, inviter la personne à relancer par e-mail direct ou WhatsApp.',
  },
  immigration: {
    category: 'immigration',
    label: 'Conseil en immigration',
    internalPath: 'conseil/mobilite-internationale',
    responseWorkflow:
      'Qualifier le pays, l’objectif de mobilité et le stade du dossier, sans demander de pièces sensibles par le site.',
    fallbackWorkflow:
      'Si l’e-mail échoue, inviter la personne à utiliser WhatsApp ou l’e-mail public sans joindre de dossier complet.',
  },
  business: {
    category: 'business',
    label: 'Solutions entreprises',
    internalPath: 'partenariats/organisations-et-entreprises',
    responseWorkflow:
      'Identifier l’organisation, le besoin collectif et le décideur, puis proposer un échange de cadrage sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, inviter l’organisation à écrire directement par e-mail public.',
  },
  partnership: {
    category: 'partnership',
    label: 'Partenariat',
    internalPath: 'partenariats/institutionnel',
    responseWorkflow:
      'Qualifier la nature du partenariat, le périmètre d’impact et le calendrier de décision sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, inviter le partenaire à écrire directement par e-mail public ou WhatsApp.',
  },
  other: {
    category: 'other',
    label: 'Autre demande',
    internalPath: 'intake/general',
    responseWorkflow:
      'Lire la demande, choisir la file interne adaptée et répondre ou réorienter sous 48h ouvrées.',
    fallbackWorkflow:
      'Si l’e-mail échoue, afficher les canaux directs et demander une relance par e-mail ou WhatsApp.',
  },
};

export function resolveContactTriagePlan(
  category: ContactFormDto['category'],
): ContactTriagePlan {
  return CONTACT_TRIAGE_PLANS[category];
}
