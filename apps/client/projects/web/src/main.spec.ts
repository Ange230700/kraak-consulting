import { describe, expect, it, vi } from 'vitest';
import { bootstrapApplication } from '@angular/platform-browser';

vi.mock('@angular/platform-browser', async (original) => ({
  ...(await original<typeof import('@angular/platform-browser')>()),
  bootstrapApplication: vi.fn().mockRejectedValue(new Error('bootstrap')),
}));

describe('Démarrage web', () => {
  it('Given un échec du démarrage, When le point d’entrée est chargé, Then l’erreur est journalisée', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    await import('./main');
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith(expect.any(Error)),
    );
    expect(bootstrapApplication).toHaveBeenCalled();
    error.mockRestore();
  });
});
