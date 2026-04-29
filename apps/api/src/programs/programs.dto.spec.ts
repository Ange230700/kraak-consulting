import { validateMarkSessionProgressPayload } from './programs.dto';

describe('Programs DTO validation', () => {
  // Given un payload valide
  // When la validation du marquage progression est exécutée
  // Then le DTO normalisé est renvoyé
  it('Given un payload valide, When validateMarkSessionProgressPayload est appelé, Then le payload normalisé est renvoyé', () => {
    const result = validateMarkSessionProgressPayload({
      sessionId: ' session-1 ',
      completed: true,
    });

    expect(result).toEqual({
      valid: true,
      data: {
        sessionId: 'session-1',
        completed: true,
      },
    });
  });

  // Given un payload invalide
  // When la validation est exécutée
  // Then les erreurs explicites sont renvoyées
  it('Given un payload invalide, When validateMarkSessionProgressPayload est appelé, Then les erreurs sont renvoyées', () => {
    const result = validateMarkSessionProgressPayload({
      sessionId: '',
      completed: 'yes',
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        'Le sessionId est requis.',
        'Le champ completed doit être un booléen.',
      ],
    });
  });
});
