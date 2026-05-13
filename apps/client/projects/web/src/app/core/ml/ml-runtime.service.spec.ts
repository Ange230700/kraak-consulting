import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { MlRuntimeService } from './ml-runtime.service';
import { TFJS_CONFIG, type TfjsConfig } from './tfjs-config';

interface TfjsRuntimeModule {
  setBackend?: (backend: string) => Promise<void> | void;
  ready?: () => Promise<void> | void;
}

interface MlRuntimeServiceSpyTarget {
  initializeRuntime: () => Promise<void>;
  loadTfjsModule: () => Promise<TfjsRuntimeModule | null>;
}

function asSpyTarget(service: MlRuntimeService): MlRuntimeServiceSpyTarget {
  return service as unknown as MlRuntimeServiceSpyTarget;
}

describe('MlRuntimeService', () => {
  afterEach(() => {
    MlRuntimeService.resetForTests();
    vi.restoreAllMocks();
  });

  it('initializes runtime only once across repeated calls', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const initSpy = vi.spyOn(spyTarget, 'initializeRuntime');

    await service.initOnce();
    await service.initOnce();

    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it('reuses the same in-flight promise for concurrent calls', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const initSpy = vi.spyOn(spyTarget, 'initializeRuntime');

    const [first, second] = await Promise.all([
      service.initOnce(),
      service.initOnce(),
    ]);

    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it('allows retry after an initialization failure', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const initSpy = vi
      .spyOn(spyTarget, 'initializeRuntime')
      .mockRejectedValueOnce(new Error('init failed'))
      .mockResolvedValueOnce(undefined);

    await expect(service.initOnce()).rejects.toThrow('init failed');
    await expect(service.initOnce()).resolves.toBeUndefined();

    expect(initSpy).toHaveBeenCalledTimes(2);
  });

  it('marks runtime initialized immediately on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [
        MlRuntimeService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const loadSpy = vi.spyOn(spyTarget, 'loadTfjsModule');

    await spyTarget.initializeRuntime();

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('configures tfjs backend and waits for readiness when module is available', async () => {
    const tfjsConfig: TfjsConfig = { backend: 'cpu' };
    TestBed.configureTestingModule({
      providers: [
        MlRuntimeService,
        { provide: TFJS_CONFIG, useValue: tfjsConfig },
      ],
    });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const setBackend = vi.fn().mockResolvedValue(undefined);
    const ready = vi.fn().mockResolvedValue(undefined);
    const loadSpy = vi
      .spyOn(spyTarget, 'loadTfjsModule')
      .mockResolvedValue({ setBackend, ready });

    await spyTarget.initializeRuntime();

    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(setBackend).toHaveBeenCalledWith('cpu');
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('skips tfjs setup when module cannot be loaded', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const loadSpy = vi
      .spyOn(spyTarget, 'loadTfjsModule')
      .mockResolvedValue(null);

    await spyTarget.initializeRuntime();

    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('does not fail bootstrap when tfjs backend setup throws', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);
    const spyTarget = asSpyTarget(service);

    const setBackend = vi.fn().mockRejectedValue(new Error('backend failed'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // no-op in tests
    });

    vi.spyOn(spyTarget, 'loadTfjsModule').mockResolvedValue({
      setBackend,
    });

    await expect(spyTarget.initializeRuntime()).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
  });
});
