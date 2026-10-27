import { Injector } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GsapAnimationsService } from './gsap-animations.service';
import { LazyGsapLoader } from './lazy-gsap-loader';

describe('Given le chargement différé des animations de page', () => {
  afterEach(() => vi.unstubAllGlobals());

  function createLoader() {
    const service = { killAllAnimations: vi.fn() };
    const injector = Injector.create({
      providers: [{ provide: GsapAnimationsService, useValue: service }],
    });
    return { loader: new LazyGsapLoader(injector), service };
  }

  it('Given le rendu serveur, When le service est résolu, Then aucune animation n’est chargée', async () => {
    const { loader } = createLoader();
    vi.stubGlobal('window', undefined);
    expect(await loader.resolve()).toBeNull();
    expect(loader.service).toBeNull();
    loader.destroy();
  });

  it('Given une page active, When le service est résolu plusieurs fois, Then la même instance est réutilisée et détruite', async () => {
    const { loader, service } = createLoader();
    expect(await loader.resolve()).toBe(service);
    expect(await loader.resolve()).toBe(service);
    expect(loader.service).toBe(service);
    loader.destroy();
    expect(service.killAllAnimations).toHaveBeenCalledOnce();
    expect(await loader.resolve()).toBeNull();
  });

  it('Given un chargement en attente, When la page est détruite, Then aucune instance n’est activée après destruction', async () => {
    const { loader, service } = createLoader();
    const pending = loader.resolve();
    loader.destroy();
    expect(await pending).toBeNull();
    expect(loader.service).toBeNull();
    expect(service.killAllAnimations).not.toHaveBeenCalled();
  });
});
