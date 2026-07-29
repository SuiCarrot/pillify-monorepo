import type { ClockPort } from '../ports/clock';
import type { NotificationPort } from '../ports/notification';
import type { StoragePort } from '../ports/storage';
import type { Medication } from '../domain/medication';
import type { ReminderPolicy } from '../domain/reminder';
import { getDashboard } from './getDashboard';
import { planReminders } from './planReminders';
import { snoozeDose, type SnoozeDoseInput } from './snoozeDose';
import { takeDose, type TakeDoseInput } from './takeDose';
import { updateMedication } from './updateMedication';

export interface UseCaseDeps {
  storage: StoragePort;
  notifications: NotificationPort;
  clock: ClockPort;
}

export function createUseCases(deps: UseCaseDeps) {
  return {
    planReminders: (policy?: ReminderPolicy) => planReminders(deps, policy),
    takeDose: (input: TakeDoseInput) => takeDose(deps, input),
    snoozeDose: (input: SnoozeDoseInput) => snoozeDose(deps, input),
    getDashboard: (medicationId?: string) => getDashboard(deps, medicationId),
    updateMedication: (med: Medication, policy?: ReminderPolicy) =>
      updateMedication(deps, med, policy),
  };
}

export type UseCases = ReturnType<typeof createUseCases>;
