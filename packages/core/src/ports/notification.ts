import type { PlannedReminder } from '../domain/reminder.js';

export type PermissionState = 'granted' | 'denied' | 'prompt';

/**
 * Declarative notification port (ADR-004).
 * `schedule` replaces the desired pending set for reconciliation by adapters.
 */
export interface NotificationPort {
  requestPermission(): Promise<PermissionState>;
  schedule(reminders: PlannedReminder[]): Promise<void>;
  cancel(reminderIds: string[]): Promise<void>;
  listPending(): Promise<string[]>;
}
