export type { CycleConfig, Medication } from './domain/medication';
export type { DoseId, DoseLog, DoseStatus } from './domain/dose';
export { makeDoseId } from './domain/dose';
export type { DomainError, DomainErrorCode, Result } from './domain/errors';
export { err, ok } from './domain/errors';
export type { PlannedReminder, ReminderId, ReminderPolicy } from './domain/reminder';
export { DEFAULT_REMINDER_POLICY, makeReminderId } from './domain/reminder';

export type { ClockPort } from './ports/clock';
export type { NotificationPort, PermissionState } from './ports/notification';
export type { DateRange, StoragePort } from './ports/storage';

export type { CycleDay } from './services/cycle';
export { cycleDayLabel, getCycleDay, isActiveDoseDay, validateCycleConfig } from './services/cycle';
export { deriveStatus } from './services/doseState';
export { buildPlannedReminders, wallClockOf } from './services/scheduler';
export {
  addLocalDays,
  atLocalWallTime,
  calendarDaysBetween,
  parseLocalDate,
  parseTimeOfDay,
  startOfLocalDay,
  toLocalDateString,
  toOffsetIso,
} from './services/dateUtils';

export { createUseCases, type UseCaseDeps, type UseCases } from './usecases/createUseCases';
export { getDashboard, type Dashboard, type DashboardMedication } from './usecases/getDashboard';
export { planReminders, type PlanRemindersResult } from './usecases/planReminders';
export { snoozeDose, type SnoozeDoseInput } from './usecases/snoozeDose';
export { takeDose, type TakeDoseInput } from './usecases/takeDose';
export { updateMedication } from './usecases/updateMedication';
