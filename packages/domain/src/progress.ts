import {
  ProgramProgressStatus,
  type ProgramProgressDto,
} from '@kraak/contracts';

export interface ProgramProgressCalculationInput {
  sessionIds: string[];
  completedSessionIds: string[];
  updatedAt?: string | null;
}

export function canMarkSessionProgress(
  sessionIds: string[],
  sessionId: string,
): boolean {
  return sessionIds.includes(sessionId);
}

export function applySessionProgressMark(
  completedSessionIds: string[],
  sessionId: string,
  completed: boolean,
): string[] {
  const next = new Set(completedSessionIds);

  if (completed) {
    next.add(sessionId);
  } else {
    next.delete(sessionId);
  }

  return Array.from(next);
}

export function calculateProgramProgress(
  input: ProgramProgressCalculationInput,
): ProgramProgressDto {
  const sessionIds = Array.from(new Set(input.sessionIds));
  const completedSessionIds = Array.from(
    new Set(input.completedSessionIds.filter((id) => sessionIds.includes(id))),
  );
  const totalSessions = sessionIds.length;
  const completedSessions = completedSessionIds.length;
  const completionRate =
    totalSessions === 0
      ? 0
      : Math.round((completedSessions / totalSessions) * 100);

  let status: ProgramProgressDto['status'] = ProgramProgressStatus.NOT_STARTED;

  if (completedSessions > 0 && completedSessions < totalSessions) {
    status = ProgramProgressStatus.IN_PROGRESS;
  }

  if (totalSessions > 0 && completedSessions === totalSessions) {
    status = ProgramProgressStatus.COMPLETED;
  }

  return {
    totalSessions,
    completedSessions,
    completionRate,
    status,
    completedSessionIds,
    updatedAt: input.updatedAt ?? null,
  };
}
