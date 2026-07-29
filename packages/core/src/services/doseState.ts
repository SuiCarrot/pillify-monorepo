import type { DoseLog } from '../domain/dose';
import type { Medication } from '../domain/medication';
import { fromOffsetIso } from './dateUtils';

/**
 * Derives pending/missed from the clock; taken/snoozed are persisted facts (D1.3).
 */
export function deriveStatus(
  log: DoseLog | undefined,
  med: Medication,
  now: Date,
): DoseLog['status'] {
  if (log?.status === 'taken') {
    return 'taken';
  }

  if (log?.status === 'snoozed' && log.snoozedUntil) {
    const until = fromOffsetIso(log.snoozedUntil);
    if (now.getTime() < until.getTime()) {
      return 'snoozed';
    }
  }

  const scheduled = resolveScheduledInstant(log, med, now);
  if (!scheduled) {
    return 'pending';
  }

  const missedAfter = new Date(scheduled.getTime());
  missedAfter.setMinutes(missedAfter.getMinutes() + med.graceMinutes);

  if (now.getTime() > missedAfter.getTime()) {
    return 'missed';
  }

  return 'pending';
}

function resolveScheduledInstant(
  log: DoseLog | undefined,
  med: Medication,
  now: Date,
): Date | undefined {
  if (log?.scheduledFor) {
    return fromOffsetIso(log.scheduledFor);
  }

  // Lazy import avoided — caller usually has a log; wall time for "today" as fallback.
  const [hoursStr, minutesStr] = med.timeOfDay.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return undefined;
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
}
