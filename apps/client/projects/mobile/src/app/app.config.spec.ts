import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from './app.config';
import { MobilePushNotificationsService } from './core/mobile-push-notifications.service';

describe('Initialisation différée mobile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([true, false])(
    'Given une disponibilité idle %s, When l’application démarre, Then les notifications sont initialisées après le premier rendu',
    async (idle) => {
      let deferred: (() => void) | undefined;
      const initialize = vi.fn().mockResolvedValue(undefined);
      if (idle) {
        vi.stubGlobal('window', {
          requestIdleCallback: (callback: () => void) => {
            deferred = callback;
          },
        });
      } else {
        vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
          deferred = callback as () => void;
          return 0 as unknown as ReturnType<typeof setTimeout>;
        });
      }
      TestBed.configureTestingModule({
        providers: [
          appConfig.providers.at(-1)!,
          { provide: MobilePushNotificationsService, useValue: { initialize } },
        ],
      });
      await TestBed.inject(ApplicationInitStatus).donePromise;
      expect(initialize).not.toHaveBeenCalled();
      deferred!();
      vi.restoreAllMocks();
      await vi.waitFor(() => expect(initialize).toHaveBeenCalledOnce());
    },
  );

  it('Given une initialisation rejetée, When la tâche différée démarre, Then l’échec est journalisé sans bloquer l’application', async () => {
    let deferred: (() => void) | undefined;
    vi.stubGlobal('window', {
      requestIdleCallback: (callback: () => void) => {
        deferred = callback;
      },
    });
    const error = new Error('notifications indisponibles');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        appConfig.providers.at(-1)!,
        {
          provide: MobilePushNotificationsService,
          useValue: { initialize: vi.fn().mockRejectedValue(error) },
        },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    deferred!();
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith(expect.any(String), error),
    );
  });
});
