import { describe, expect, it } from 'vitest';
import {
  participantAreaCanMatch,
  participantAreaRoutes,
} from './participant-area.prod.routes';

describe('Routes participant en production', () => {
  it('Given la variante de production sans espace participant, When les routes sont évaluées, Then aucun accès n’est exposé', () => {
    expect(participantAreaRoutes).toEqual([]);
    expect(participantAreaCanMatch({}, [])).toBe(false);
  });
});
