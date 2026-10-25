import { apiMessage, translateApiMessage } from './api-message';

describe('API message localization', () => {
  it('Given une langue inconnue et un paramètre manquant, When le message est traduit, Then le français et son emplacement sont conservés', () => {
    expect(
      translateApiMessage(
        'unsupported' as Parameters<typeof translateApiMessage>[0],
        apiMessage('validation.requiredField'),
      ),
    ).toBe('Le champ {{field}} est requis.');
  });
  it('preserves legacy string messages unchanged', () => {
    expect(translateApiMessage('en-GB', 'Legacy API message')).toBe(
      'Legacy API message',
    );
  });

  it('translates a descriptor to English', () => {
    expect(
      translateApiMessage('en-GB', apiMessage('auth.bearerRequired')),
    ).toBe('A Bearer authorization header is required.');
  });

  it('interpolates descriptor parameters', () => {
    expect(
      translateApiMessage(
        'en-GB',
        apiMessage('validation.requiredField', {
          field: 'title',
        }),
      ),
    ).toBe('The title field is required.');
  });

  it('interpolates multiple status-transition parameters', () => {
    expect(
      translateApiMessage(
        'en-GB',
        apiMessage('support.invalidStatusTransition', {
          fromStatus: 'open',
          toStatus: 'closed',
        }),
      ),
    ).toBe('Invalid status transition: open -> closed.');
  });
});
