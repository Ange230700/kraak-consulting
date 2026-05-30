import { describe, expect, it } from 'vitest';
import { ProgramProgressStatus } from '@kraak/contracts';
import {
  applySessionProgressMark,
  calculateProgramProgress,
  canMarkSessionProgress,
} from './progress';

describe('canMarkSessionProgress', () => {
  it('returns true when the session belongs to the current program detail', () => {
    expect(
      canMarkSessionProgress(['session-1', 'session-2'], 'session-2'),
    ).toBe(true);
  });

  it('returns false for sessions that are not part of the program', () => {
    expect(
      canMarkSessionProgress(['session-1', 'session-2'], 'session-3'),
    ).toBe(false);
  });
});

describe('applySessionProgressMark', () => {
  it('adds a completed marker when completed is true', () => {
    expect(applySessionProgressMark(['session-1'], 'session-2', true)).toEqual([
      'session-1',
      'session-2',
    ]);
  });

  it('removes a completed marker when completed is false', () => {
    expect(
      applySessionProgressMark(['session-1', 'session-2'], 'session-2', false),
    ).toEqual(['session-1']);
  });
});

describe('calculateProgramProgress', () => {
  it('returns zero progress when the program has no sessions', () => {
    const progress = calculateProgramProgress({
      sessionIds: [],
      completedSessionIds: ['session-1'],
    });

    expect(progress).toMatchObject({
      totalSessions: 0,
      completedSessions: 0,
      completionRate: 0,
      status: ProgramProgressStatus.NOT_STARTED,
      completedSessionIds: [],
      updatedAt: null,
    });
  });

  it('returns not_started when no session is completed', () => {
    const progress = calculateProgramProgress({
      sessionIds: ['session-1', 'session-2'],
      completedSessionIds: [],
    });

    expect(progress).toMatchObject({
      totalSessions: 2,
      completedSessions: 0,
      completionRate: 0,
      status: ProgramProgressStatus.NOT_STARTED,
    });
  });

  it('returns in_progress when only part of sessions are completed', () => {
    const progress = calculateProgramProgress({
      sessionIds: ['session-1', 'session-2', 'session-3'],
      completedSessionIds: ['session-1'],
    });

    expect(progress).toMatchObject({
      totalSessions: 3,
      completedSessions: 1,
      completionRate: 33,
      status: ProgramProgressStatus.IN_PROGRESS,
    });
  });

  it('returns completed when all sessions are completed', () => {
    const progress = calculateProgramProgress({
      sessionIds: ['session-1', 'session-2'],
      completedSessionIds: ['session-1', 'session-2'],
      updatedAt: '2026-04-29T09:00:00.000Z',
    });

    expect(progress).toMatchObject({
      totalSessions: 2,
      completedSessions: 2,
      completionRate: 100,
      status: ProgramProgressStatus.COMPLETED,
      updatedAt: '2026-04-29T09:00:00.000Z',
    });
  });
});
