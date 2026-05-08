import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import { MlRuntimeService } from './ml-runtime.service';

describe('MlRuntimeService', () => {
  afterEach(() => {
    MlRuntimeService.resetForTests();
    vi.restoreAllMocks();
  });

  it('initializes runtime only once across repeated calls', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);

    const initSpy = vi.spyOn(
      service as unknown as { initializeRuntime: () => Promise<void> },
      'initializeRuntime',
    );

    await service.initOnce();
    await service.initOnce();

    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it('reuses the same in-flight promise for concurrent calls', async () => {
    TestBed.configureTestingModule({ providers: [MlRuntimeService] });
    const service = TestBed.inject(MlRuntimeService);

    const initSpy = vi.spyOn(
      service as unknown as { initializeRuntime: () => Promise<void> },
      'initializeRuntime',
    );

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

    const initSpy = vi
      .spyOn(
        service as unknown as { initializeRuntime: () => Promise<void> },
        'initializeRuntime',
      )
      .mockRejectedValueOnce(new Error('init failed'))
      .mockResolvedValueOnce(undefined);

    await expect(service.initOnce()).rejects.toThrow('init failed');
    await expect(service.initOnce()).resolves.toBeUndefined();

    expect(initSpy).toHaveBeenCalledTimes(2);
  });
});
