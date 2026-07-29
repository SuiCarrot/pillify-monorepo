import { makeDoseId } from '../domain/dose';
import type { DoseLog } from '../domain/dose';
import type { Medication } from '../domain/medication';
import {
  DEFAULT_REMINDER_POLICY,
  makeReminderId,
  type PlannedReminder,
  type ReminderPolicy,
} from '../domain/reminder';
import { getCycleDay } from './cycle';
import {
  addLocalDays,
  atLocalWallTime,
  startOfLocalDay,
  toLocalDateString,
  toOffsetIso,
} from './dateUtils';

export interface BuildRemindersInput {
  medications: Medication[];
  doseLogs: DoseLog[];
  now: Date;
  policy?: ReminderPolicy;
}

/**
 * Computes the rolling reminder horizon (ADR-004 / ADR-005).
 * Pure: does not touch ports.
 */
export function buildPlannedReminders(input: BuildRemindersInput): PlannedReminder[] {
  const policy = input.policy ?? DEFAULT_REMINDER_POLICY;
  const logsById = new Map(input.doseLogs.map((log) => [log.id, log]));
  const reminders: PlannedReminder[] = [];
  const today = startOfLocalDay(input.now);

  for (const med of input.medications) {
    if (!med.active) {
      continue;
    }

    for (let offset = 0; offset < policy.horizonDays; offset += 1) {
      const day = addLocalDays(today, offset);
      const cycleDay = getCycleDay(med, day);
      if (!cycleDay.ok || cycleDay.value.kind !== 'active') {
        continue;
      }

      const localDate = toLocalDateString(day);
      const doseId = makeDoseId(med.id, localDate);
      const existing = logsById.get(doseId);

      if (existing?.status === 'taken') {
        continue;
      }

      const scheduled = atLocalWallTime(day, med.timeOfDay);
      if (!scheduled.ok) {
        continue;
      }

      let baseFireAt = scheduled.value;

      if (existing?.status === 'snoozed' && existing.snoozedUntil) {
        const snoozedUntil = new Date(existing.snoozedUntil);
        if (snoozedUntil.getTime() > input.now.getTime()) {
          baseFireAt = snoozedUntil;
        }
      }

      for (let attempt = 0; attempt < policy.escalationOffsetsMinutes.length; attempt += 1) {
        const offsetMinutes = policy.escalationOffsetsMinutes[attempt] ?? 0;
        const fireAt = new Date(baseFireAt.getTime());
        fireAt.setMinutes(fireAt.getMinutes() + offsetMinutes);

        if (fireAt.getTime() <= input.now.getTime()) {
          continue;
        }

        reminders.push({
          id: makeReminderId(doseId, attempt),
          medicationId: med.id,
          doseId,
          attempt,
          fireAt: toOffsetIso(fireAt),
          title: med.name,
          body: `Hora de tomar ${med.name}`,
        });
      }
    }
  }

  return reminders;
}

/** Wall-clock hour/minute for a planned fire instant (local). */
export function wallClockOf(iso: string): { hours: number; minutes: number } {
  const date = new Date(iso);
  return { hours: date.getHours(), minutes: date.getMinutes() };
}
