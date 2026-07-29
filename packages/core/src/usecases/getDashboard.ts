import type { DoseStatus } from '../domain/dose';
import { makeDoseId } from '../domain/dose';
import { err, ok, type Result } from '../domain/errors';
import type { Medication } from '../domain/medication';
import type { ClockPort } from '../ports/clock';
import type { StoragePort } from '../ports/storage';
import { cycleDayLabel, getCycleDay, type CycleDay } from '../services/cycle';
import { deriveStatus } from '../services/doseState';
import { atLocalWallTime, toLocalDateString, toOffsetIso } from '../services/dateUtils';

export interface GetDashboardDeps {
  storage: StoragePort;
  clock: ClockPort;
}

export interface DashboardMedication {
  medication: Medication;
  cycleDay: CycleDay;
  cycleDayLabel: string;
  todayStatus: DoseStatus;
  todayDoseId: string;
  scheduledFor: string;
}

export interface Dashboard {
  now: string;
  medications: DashboardMedication[];
}

export async function getDashboard(
  deps: GetDashboardDeps,
  medicationId?: string,
): Promise<Result<Dashboard>> {
  const now = deps.clock.now();
  const all = await deps.storage.getMedications();
  const medications = medicationId ? all.filter((med) => med.id === medicationId) : all;

  if (medicationId && medications.length === 0) {
    return err('MEDICATION_NOT_FOUND', `Medication not found: ${medicationId}`);
  }

  const items: DashboardMedication[] = [];

  for (const med of medications) {
    const cycleDay = getCycleDay(med, now);
    if (!cycleDay.ok) {
      return cycleDay;
    }

    const localDate = toLocalDateString(now);
    const doseId = makeDoseId(med.id, localDate);
    const log = await deps.storage.getDoseLog(doseId);
    const scheduled = atLocalWallTime(now, med.timeOfDay);
    if (!scheduled.ok) {
      return scheduled;
    }

    items.push({
      medication: med,
      cycleDay: cycleDay.value,
      cycleDayLabel: cycleDayLabel(cycleDay.value),
      todayStatus: deriveStatus(log, med, now),
      todayDoseId: doseId,
      scheduledFor: log?.scheduledFor ?? toOffsetIso(scheduled.value),
    });
  }

  return ok({
    now: toOffsetIso(now),
    medications: items,
  });
}
