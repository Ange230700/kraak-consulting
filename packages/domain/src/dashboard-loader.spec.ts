import { describe, expect, it, vi } from 'vitest';
import type { DashboardAggregateDto } from '@kraak/contracts';
import {
  loadDashboardAggregate,
  resolveDashboardErrorMessage,
} from './dashboard-loader';

const createAggregate = (): DashboardAggregateDto =>
  ({
    profile: { id: 'usr-1' },
  }) as unknown as DashboardAggregateDto;

const createSetters = () => ({
  setLoading: vi.fn<(value: boolean) => void>(),
  setData: vi.fn<(value: DashboardAggregateDto | null) => void>(),
  setError: vi.fn<(value: string | null) => void>(),
});

describe('resolveDashboardErrorMessage', () => {
  it('Given an error with a non-empty body.message, When resolving, Then it returns the body message', () => {
    const error = { body: { message: '  Erreur API  ' } };
    expect(resolveDashboardErrorMessage(error)).toBe('  Erreur API  ');
  });

  it('Given an error with a whitespace body.message, When resolving, Then it falls back to the Error message', () => {
    const error = Object.assign(new Error('From error'), {
      body: { message: '   ' },
    });
    expect(resolveDashboardErrorMessage(error)).toBe('From error');
  });

  it('Given a generic Error with a non-empty message, When resolving, Then it returns the trimmed Error message', () => {
    expect(resolveDashboardErrorMessage(new Error('  boom  '))).toBe('boom');
  });

  it('Given a non-Error value, When resolving, Then it returns the default fallback', () => {
    expect(resolveDashboardErrorMessage('nope')).toBe(
      'Impossible de charger votre dashboard pour le moment.',
    );
    expect(resolveDashboardErrorMessage(null)).toBe(
      'Impossible de charger votre dashboard pour le moment.',
    );
    expect(resolveDashboardErrorMessage(undefined)).toBe(
      'Impossible de charger votre dashboard pour le moment.',
    );
  });

  it('Given an empty Error message and a custom fallback, When resolving, Then it returns the custom fallback', () => {
    expect(resolveDashboardErrorMessage(new Error('   '), 'custom')).toBe(
      'custom',
    );
  });

  it('Given an ApiError-like Error carrying a body without message, When resolving, Then it returns the fallback instead of the Error message', () => {
    const error = Object.assign(new Error('HTTP 500'), {
      body: {},
      status: 500,
    });
    expect(resolveDashboardErrorMessage(error, 'fb')).toBe('fb');
  });
});

describe('loadDashboardAggregate', () => {
  it('Given getAggregate resolves, When loading, Then it sets loading, clears error, sets data, and stops loading', async () => {
    const aggregate = createAggregate();
    const getAggregate = vi.fn().mockResolvedValue(aggregate);
    const { setLoading, setData, setError } = createSetters();

    await loadDashboardAggregate({
      getAggregate,
      setLoading,
      setData,
      setError,
    });

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setError).toHaveBeenCalledWith(null);
    expect(setData).toHaveBeenCalledWith(aggregate);
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(setLoading).toHaveBeenCalledTimes(2);
  });

  it('Given getAggregate rejects with body.message, When loading, Then it sets the body message as error and clears data', async () => {
    const error = { body: { message: 'Erreur métier' } };
    const getAggregate = vi.fn().mockRejectedValue(error);
    const { setLoading, setData, setError } = createSetters();

    await loadDashboardAggregate({
      getAggregate,
      setLoading,
      setData,
      setError,
    });

    expect(setData).toHaveBeenLastCalledWith(null);
    expect(setError).toHaveBeenLastCalledWith('Erreur métier');
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('Given getAggregate rejects without a usable message, When loading, Then it falls back to the default message', async () => {
    const getAggregate = vi.fn().mockRejectedValue('opaque');
    const { setLoading, setData, setError } = createSetters();

    await loadDashboardAggregate({
      getAggregate,
      setLoading,
      setData,
      setError,
    });

    expect(setError).toHaveBeenLastCalledWith(
      'Impossible de charger votre dashboard pour le moment.',
    );
    expect(setData).toHaveBeenLastCalledWith(null);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('Given a custom fallbackMessage and getAggregate rejects opaquely, When loading, Then it uses the custom fallback', async () => {
    const getAggregate = vi.fn().mockRejectedValue(undefined);
    const { setLoading, setData, setError } = createSetters();

    await loadDashboardAggregate({
      getAggregate,
      setLoading,
      setData,
      setError,
      fallbackMessage: 'fallback custom',
    });

    expect(setError).toHaveBeenLastCalledWith('fallback custom');
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it('Given a custom resolveErrorMessage, When loading and getAggregate rejects, Then the resolver is invoked with error and fallback', async () => {
    const error = new Error('original');
    const getAggregate = vi.fn().mockRejectedValue(error);
    const { setLoading, setData, setError } = createSetters();
    const resolveErrorMessage = vi.fn().mockReturnValue('resolved');

    await loadDashboardAggregate({
      getAggregate,
      setLoading,
      setData,
      setError,
      fallbackMessage: 'fb',
      resolveErrorMessage,
    });

    expect(resolveErrorMessage).toHaveBeenCalledWith(error, 'fb');
    expect(setError).toHaveBeenLastCalledWith('resolved');
  });

  it('Given getAggregate throws synchronously, When loading, Then the finally branch still stops loading', async () => {
    const getAggregate = vi.fn(() => {
      throw new Error('sync boom');
    });
    const { setLoading, setData, setError } = createSetters();

    await loadDashboardAggregate({
      getAggregate,
      setLoading,
      setData,
      setError,
    });

    expect(setError).toHaveBeenLastCalledWith('sync boom');
    expect(setData).toHaveBeenLastCalledWith(null);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
