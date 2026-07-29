import { makeDoseId, type DoseLog } from '../domain/dose';
import { ok, type Result } from '../domain/errors';
import type { Medication } from '../domain/medication';
import type { ReminderPolicy } from '../domain/reminder';
import { DEFAULT_REMINDER_POLICY } from '../domain/reminder';
import type { ClockPort } from '../ports/clock';
import type { NotificationPort } from '../ports/notification';
import type { StoragePort } from '../ports/storage';
import { validateCycleConfig } from '../services/cycle';
import {
  atLocalWallTime,
  parseTimeOfDay,
  toLocalDateString,
  toOffsetIso,
} from '../services/dateUtils';
import { planReminders } from './planReminders';

export interface UpdateMedicationDeps {
  storage: StoragePort;
  notifications: NotificationPort;
  clock: ClockPort;
}

/**
 * Persists medication changes and reconciles today's dose log when the schedule moves.
 * Taken doses are left untouched; snoozed/pending logs get a fresh pending schedule.
 */
export async function updateMedication(
  deps: UpdateMedicationDeps,
  med: Medication,
  policy: ReminderPolicy = DEFAULT_REMINDER_POLICY,
): Promise<Result<Medication>> {
  const cycleCheck = validateCycleConfig(med.cycle);
  if (!cycleCheck.ok) {
    return cycleCheck;
  }

  const timeCheck = parseTimeOfDay(med.timeOfDay);
  if (!timeCheck.ok) {
    return timeCheck;
  }

  const previous = await deps.storage.getMedication(med.id);
  await deps.storage.saveMedication(med);

  const scheduleChanged =
    !previous ||
    previous.timeOfDay !== med.timeOfDay ||
    previous.cycleStartDate !== med.cycleStartDate ||
    JSON.stringify(previous.cycle) !== JSON.stringify(med.cycle);

  if (scheduleChanged) {
    await reconcileTodayDoseLog(deps, med);
  }

  await planReminders(deps, policy);
  return ok(med);
}

async function reconcileTodayDoseLog(
  deps: UpdateMedicationDeps,
  med: Medication,
): Promise<void> {
  const now = deps.clock.now();
  const localDate = toLocalDateString(now);
  const doseId = makeDoseId(med.id, localDate);
  const existing = await deps.storage.getDoseLog(doseId);

  if (existing?.status === 'taken') {
    return;
  }

  const scheduled = atLocalWallTime(now, med.timeOfDay);
  if (!scheduled.ok) {
    return;
  }

  const log: DoseLog = {
    id: doseId,
    medicationId: med.id,
    scheduledFor: toOffsetIso(scheduled.value),
    status: 'pending',
  };

  await deps.storage.upsertDoseLog(log);
}
