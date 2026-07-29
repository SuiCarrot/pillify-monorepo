import { makeDoseId, type DoseLog } from '../domain/dose';
import { err, ok, type Result } from '../domain/errors';
import { makeReminderId, type ReminderPolicy, DEFAULT_REMINDER_POLICY } from '../domain/reminder';
import type { ClockPort } from '../ports/clock';
import type { NotificationPort } from '../ports/notification';
import type { StoragePort } from '../ports/storage';
import { getCycleDay } from '../services/cycle';
import {
  atLocalWallTime,
  parseLocalDate,
  startOfLocalDay,
  toLocalDateString,
  toOffsetIso,
} from '../services/dateUtils';

export interface TakeDoseDeps {
  storage: StoragePort;
  notifications: NotificationPort;
  clock: ClockPort;
}

export interface TakeDoseInput {
  medicationId: string;
  /** Local calendar day of the dose; defaults to today. */
  localDate?: string;
  policy?: ReminderPolicy;
}

export async function takeDose(
  deps: TakeDoseDeps,
  input: TakeDoseInput,
): Promise<Result<DoseLog>> {
  const med = await deps.storage.getMedication(input.medicationId);
  if (!med) {
    return err('MEDICATION_NOT_FOUND', `Medication not found: ${input.medicationId}`);
  }

  if (!med.active) {
    return err('MEDICATION_INACTIVE', `Medication is inactive: ${input.medicationId}`);
  }

  const now = deps.clock.now();
  const dayResult = input.localDate ? parseLocalDate(input.localDate) : ok(startOfLocalDay(now));
  if (!dayResult.ok) {
    return dayResult;
  }

  const dayStart = dayResult.value;
  const localDate = input.localDate ?? toLocalDateString(now);

  const cycleDay = getCycleDay(med, dayStart);
  if (!cycleDay.ok) {
    return cycleDay;
  }

  if (cycleDay.value.kind === 'break') {
    return err('DOSE_ON_BREAK_DAY', 'Cannot take a dose on a break day');
  }

  const scheduled = atLocalWallTime(dayStart, med.timeOfDay);
  if (!scheduled.ok) {
    return scheduled;
  }

  const doseId = makeDoseId(med.id, localDate);
  const log: DoseLog = {
    id: doseId,
    medicationId: med.id,
    scheduledFor: toOffsetIso(scheduled.value),
    status: 'taken',
    takenAt: toOffsetIso(now),
  };

  await deps.storage.upsertDoseLog(log);

  const policy = input.policy ?? DEFAULT_REMINDER_POLICY;
  const reminderIds = policy.escalationOffsetsMinutes.map((_, attempt) =>
    makeReminderId(doseId, attempt),
  );
  await deps.notifications.cancel(reminderIds);

  return ok(log);
}
