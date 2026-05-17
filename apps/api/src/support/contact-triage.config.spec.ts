import type { ContactFormDto } from '@kraak/contracts';
import {
  CONTACT_TRIAGE_PLANS,
  resolveContactTriagePlan,
} from './contact-triage.config';

describe('contact triage config', () => {
  it('Given toutes les catégories de contact, When la configuration est lue, Then chaque catégorie a une file, un workflow et un fallback', () => {
    const categories: ContactFormDto['category'][] = [
      'technical',
      'training',
      'program',
      'session',
      'billing',
      'project_management',
      'immigration',
      'business',
      'partnership',
      'other',
    ];

    expect(
      Object.keys(CONTACT_TRIAGE_PLANS).sort((a, b) => a.localeCompare(b)),
    ).toEqual([...categories].sort((a, b) => a.localeCompare(b)));
    expect(
      categories.every((category) => {
        const plan = resolveContactTriagePlan(category);

        return (
          plan.category === category &&
          plan.internalPath.length > 0 &&
          plan.responseWorkflow.length > 0 &&
          plan.fallbackWorkflow.length > 0
        );
      }),
    ).toBe(true);
  });

  it('Given une demande immigration, When le plan est résolu, Then il évite le dépôt de dossier sensible sur le site', () => {
    const plan = resolveContactTriagePlan('immigration');

    expect(plan.internalPath).toBe('conseil/mobilite-internationale');
    expect(plan.responseWorkflow).toContain(
      'sans demander de pièces sensibles',
    );
    expect(plan.fallbackWorkflow).toContain('sans joindre de dossier complet');
  });
});
